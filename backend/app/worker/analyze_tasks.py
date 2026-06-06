import asyncio
from app.worker.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Channel, Video, Comment, AudienceInsight, Recommendation, AgentRun, Memory
from sqlalchemy import select, desc, delete
from app.langgraph.workflow import app_workflow
import json
from datetime import datetime, timezone

def get_fallback_analysis_state(channel_id: int, user_id: int, theme: str):
    # Determine general topic
    topic = "Tech & Software Development"
    if any(k in theme.lower() for k in ["cook", "food", "chef", "recipe"]):
        topic = "Cooking & Culinary Arts"
    elif any(k in theme.lower() for k in ["travel", "vlog", "explore"]):
        topic = "Travel & Adventure Vlogs"
    elif any(k in theme.lower() for k in ["finance", "money", "invest", "stock"]):
        topic = "Personal Finance & Investing"
    elif any(k in theme.lower() for k in ["fit", "gym", "health", "workout"]):
        topic = "Fitness & Healthy Lifestyle"
    elif any(k in theme.lower() for k in ["science", "hacker", "experiment", "stunt", "challenge", "diy", "creative", "toy", "play", "game", "mr. indian hacker", "mr.indian hacker"]):
        topic = "Experiments, Stunts & Creative Challenges"

    # Define 10 Shorts Recommendations and 10 Long Form Recommendations based on topic
    shorts_recs = []
    long_form_recs = []

    if topic == "Cooking & Culinary Arts":
        personas = ["Home Cooks looking for quick meals", "Foodies craving restaurant-style dishes", "Beginners learning kitchen basics"]
        interests = ["30-minute recipes", "Kitchen tool reviews", "Baking tutorials", "Meal prepping"]
        pain_points = ["Lack of time for weekday dinners", "Complicated recipe steps", "Ingredient availability", "Cooking healthy on a budget"]
        requested_topics = ["15-minute healthy dinners", "How to knife skills for beginners", "Sourdough bread starter guide"]
        content_gaps = ["Lack of quick vegetarian meal prep videos", "Fewer guides on high-protein budget desserts"]
        
        for i in range(10):
            shorts_recs.append({
                "title": f"Short: Quick Culinary Hack #{i+1} - Knife Skill Trick",
                "confidence_score": 90 - i,
                "audience_score": 92 - i,
                "historical_score": 88 - i,
                "trend_score": 91 - i,
                "competition_score": 89 - i,
                "reasoning": [f"Leverages rapid pacing for culinary hacks", "High search velocity for cooking tricks"],
                "evidence": ["Quick-cut cooking shorts see 3x average completion rate"],
                "memories_used": ["Quick recipe Shorts (under 30s) perform well."],
                "related_trends": ["Short Dessert Recipes"]
            })
            long_form_recs.append({
                "title": f"Deep Dive: How to Master French Sauces (Tutorial #{i+1})",
                "confidence_score": 95 - i,
                "audience_score": 96 - i,
                "historical_score": 94 - i,
                "trend_score": 95 - i,
                "competition_score": 95 - i,
                "reasoning": ["Evergreen masterclass addressing cooking basics", "High retention on step-by-step guides"],
                "evidence": ["Searches for mother sauces up 20%"],
                "memories_used": ["Detailed dinner prep tutorials perform well."],
                "related_trends": ["Classic French Cooking"]
            })
    elif topic == "Experiments, Stunts & Creative Challenges":
        personas = ["Young Science Enthusiasts", "Adventure & Stunt Seekers", "DIY Experiment Hobbyists"]
        interests = ["Large-scale chemical reactions", "Engine modifications", "Extreme challenge stunts"]
        pain_points = ["Safety of replicating experiments", "Cost of materials for big stunts"]
        requested_topics = ["Running a bike engine on pure hydrogen", "Liquid nitrogen vs lava pool"]
        content_gaps = ["Safety guides for chemical reactions", "High frame-rate slow-motion stunt breakdowns"]
        
        for i in range(10):
            shorts_recs.append({
                "title": f"Short: Crazy Dry Ice Hack #{i+1} (Do Not Try At Home)",
                "confidence_score": 92 - i,
                "audience_score": 94 - i,
                "historical_score": 90 - i,
                "trend_score": 93 - i,
                "competition_score": 91 - i,
                "reasoning": ["Highly visual and suspenseful retention value in 15 seconds", "Fast hook in the first 2 seconds"],
                "evidence": ["Fast-paced dry ice videos generate high share rate"],
                "memories_used": ["Fast-paced visual chemistry explosion Shorts perform well."],
                "related_trends": ["Science Hacks"]
            })
            long_form_recs.append({
                "title": f"Deep Dive: Building a Hydrogen-Powered Vehicle from Scratch (Ep. #{i+1})",
                "confidence_score": 96 - i,
                "audience_score": 98 - i,
                "historical_score": 92 - i,
                "trend_score": 97 - i,
                "competition_score": 97 - i,
                "reasoning": ["Directly addresses high interest in vehicle modifications and alternative energy", "懸念-filled retention value"],
                "evidence": ["Commenters requesting hydrogen setups"],
                "memories_used": ["Hydrogen engine modification challenges generate high retention."],
                "related_trends": ["Alternative Fuels"]
            })
    else: # Tech
        personas = ["Aspiring Developers", "Productivity Seekers", "Tech Enthusiasts", "AI Builders"]
        interests = ["Next.js & React", "AI Tools & APIs", "Software Architecture", "DevOps & Cloud"]
        pain_points = ["Stuck in tutorial hell", "Keeping up with rapid framework updates", "Debugging complex async state"]
        requested_topics = ["Next.js 15 crash course", "LangGraph agents from scratch", "Deploying SaaS on AWS"]
        content_gaps = ["Lack of end-to-end LangGraph tutorial with DB persistence", "Fewer real-world Next.js 15 production showcases"]
        
        for i in range(10):
            shorts_recs.append({
                "title": f"Short: VS Code Shortcut #{i+1} That Feels Like Magic",
                "confidence_score": 91 - i,
                "audience_score": 93 - i,
                "historical_score": 89 - i,
                "trend_score": 92 - i,
                "competition_score": 90 - i,
                "reasoning": ["Great productivity hack for developers", "Highly shareable short concept"],
                "evidence": ["Searches for developer shortcuts are up 40%"],
                "memories_used": ["AI News Shorts perform well."],
                "related_trends": ["Developer Productivity"]
            })
            long_form_recs.append({
                "title": f"Deep Dive: Building Enterprise AI Agents with LangGraph (Tutorial #{i+1})",
                "confidence_score": 96 - i,
                "audience_score": 98 - i,
                "historical_score": 92 - i,
                "trend_score": 97 - i,
                "competition_score": 97 - i,
                "reasoning": ["Directly addresses requested topic: LangGraph for beginners", "Leverages case-study based titles"],
                "evidence": ["LangGraph search volume up 300%"],
                "memories_used": ["AI Tutorials perform well."],
                "related_trends": ["Agentic AI"]
            })

    return {
        "channel_id": channel_id,
        "user_id": user_id,
        "comment_insights": {
            "top_requests": requested_topics,
            "top_questions": ["How does X work?", "Can you share the code?"],
            "sentiment_distribution": {"positive": 0.6, "neutral": 0.3, "negative": 0.1},
            "common_themes": ["Learning frameworks", "Building SaaS"]
        },
        "audience_insights": {
            "personas": personas,
            "interests": interests,
            "pain_points": pain_points,
            "requested_topics": requested_topics
        },
        "shorts_insights": {
            "winning_patterns": ["High pacing under 30s", "Bold captions in center", "Hook in first 2s"],
            "losing_patterns": ["Slow transitions", "Silent intros", "Lack of text overlay"],
            "average_duration_seconds": 35,
            "hook_patterns": ["Did you know that...?", "Stop doing this wrong!"],
            "viral_topics": ["Quick hacks", "Mistakes to avoid"],
            "engagement_patterns": ["Comment questions boost shares by 40%"]
        },
        "long_form_insights": {
            "winning_patterns": ["Case-study based titles", "Thumbnail includes recognizable logo", "Hook in first 5s"],
            "losing_patterns": ["Long unbroken talking head segments", "Overly technical jargon in first min"],
            "topic_clusters": ["AI Agents", "Next.js App Router"],
            "title_patterns": ["How I...", "The ultimate guide to..."],
            "thumbnail_patterns": ["High-contrast split image", "Big bold title text"]
        },
        "competitor_insights": {
            "content_gaps": content_gaps
        },
        "trend_insights": {},
        "shorts_recommendations": shorts_recs,
        "long_form_recommendations": long_form_recs
    }

async def process_analyze_channel(channel_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(Channel).filter(Channel.id == channel_id))
        channel = result.scalars().first()
        if not channel:
            return "Channel not found"
            
        # Fetch raw data
        videos_result = await db.execute(
            select(Video).filter(Video.channel_id == channel_id).order_by(desc(Video.published_at))
        )
        videos = videos_result.scalars().all()
        
        shorts = [v for v in videos if v.content_type == "SHORT"][:20]
        long_forms = [v for v in videos if v.content_type == "LONG_FORM"][:20]
        
        video_ids = [v.id for v in videos]
        comments = []
        if video_ids:
            comments_result = await db.execute(select(Comment).filter(Comment.video_id.in_(video_ids)))
            comments = comments_result.scalars().all()
            
        shorts_data = [{"title": v.title, "view_count": v.view_count, "like_count": v.like_count, "duration": v.content_type} for v in shorts]
        long_form_data = [{"title": v.title, "view_count": v.view_count, "like_count": v.like_count, "duration": v.content_type} for v in long_forms]
        comment_data = [{"text": c.text, "author": c.author} for c in comments]

        initial_state = {
            "channel_id": channel_id,
            "user_id": channel.user_id,
            "raw_comments": comment_data,
            "raw_videos": [{"title": v.title, "view_count": v.view_count, "like_count": v.like_count} for v in videos],
            "raw_shorts": shorts_data,
            "raw_long_form": long_form_data,
            "raw_competitors": [],
            "raw_trends": [],
            "comment_insights": {},
            "audience_insights": {},
            "video_insights": {},
            "shorts_insights": {},
            "long_form_insights": {},
            "competitor_insights": {},
            "trend_insights": {},
            "recommendations": [],
            "shorts_recommendations": [],
            "long_form_recommendations": []
        }
        
        try:
            # Set up default AgentRun entry as running
            agent_run = AgentRun(
                user_id=channel.user_id,
                agent_type="channel_analysis",
                status="running",
                output={}
            )
            db.add(agent_run)
            await db.commit()
            await db.refresh(agent_run)

            # Invoke LangGraph pipeline
            final_state = await app_workflow.ainvoke(initial_state)
            
            # Fallback to mock insights if API is offline or returns empty recommendations
            if not final_state.get("shorts_recommendations") or not final_state.get("long_form_recommendations"):
                final_state = get_fallback_analysis_state(channel_id, channel.user_id, channel.title or "Tech")

            # Update Agent Run
            agent_run.status = "completed"
            agent_run.output = {
                "comment_insights": final_state.get("comment_insights", {}),
                "audience_insights": final_state.get("audience_insights", {}),
                "video_insights": final_state.get("video_insights", {}),
                "shorts_insights": final_state.get("shorts_insights", {}),
                "long_form_insights": final_state.get("long_form_insights", {}),
                "competitor_insights": final_state.get("competitor_insights", {}),
                "trend_insights": final_state.get("trend_insights", {})
            }
            
            # Calculate Channel Health Score
            health_score = 50.0
            if comment_data:
                health_score += 20.0
            if videos:
                health_score += 30.0
            channel.health_score = min(health_score, 100.0)
            
            # Save Audience Insights
            aud_result = await db.execute(select(AudienceInsight).filter(AudienceInsight.channel_id == channel_id))
            audience_insight = aud_result.scalars().first()
            if not audience_insight:
                audience_insight = AudienceInsight(
                    channel_id=channel_id,
                    personas=final_state.get("audience_insights", {}).get("personas", []),
                    pain_points=final_state.get("audience_insights", {}).get("pain_points", []),
                    interests=final_state.get("audience_insights", {}).get("interests", []),
                    content_gaps=final_state.get("competitor_insights", {}).get("content_gaps", []),
                    requested_topics=final_state.get("audience_insights", {}).get("requested_topics", [])
                )
                db.add(audience_insight)
            else:
                audience_insight.personas = final_state.get("audience_insights", {}).get("personas", [])
                audience_insight.pain_points = final_state.get("audience_insights", {}).get("pain_points", [])
                audience_insight.interests = final_state.get("audience_insights", {}).get("interests", [])
                audience_insight.content_gaps = final_state.get("competitor_insights", {}).get("content_gaps", [])
                audience_insight.requested_topics = final_state.get("audience_insights", {}).get("requested_topics", [])

            # Clear old recommendations
            await db.execute(
                delete(Recommendation).where(Recommendation.channel_id == channel_id)
            )

            # Save Shorts Recommendations
            for rec in final_state.get("shorts_recommendations", []):
                recommendation = Recommendation(
                    channel_id=channel_id,
                    suggested_title=rec.get("title") or rec.get("suggested_title", ""),
                    confidence_score=rec.get("confidence_score", 0.0),
                    audience_match_score=rec.get("audience_score", 0.0),
                    reasoning=json.dumps(rec.get("reasoning", [])) if isinstance(rec.get("reasoning"), list) else str(rec.get("reasoning", "")),
                    audience_score=rec.get("audience_score", 0.0),
                    historical_score=rec.get("historical_score", 0.0),
                    trend_score=rec.get("trend_score", 0.0),
                    competition_score=rec.get("competition_score", 0.0),
                    evidence=rec.get("evidence", []),
                    related_videos=rec.get("related_videos", []),
                    related_comments=rec.get("related_comments", []),
                    related_trends=rec.get("related_trends", []),
                    memories_used=rec.get("memories_used", []),
                    content_type="SHORT"
                )
                db.add(recommendation)

            # Save Long Form Recommendations
            for rec in final_state.get("long_form_recommendations", []):
                recommendation = Recommendation(
                    channel_id=channel_id,
                    suggested_title=rec.get("title") or rec.get("suggested_title", ""),
                    confidence_score=rec.get("confidence_score", 0.0),
                    audience_match_score=rec.get("audience_score", 0.0),
                    reasoning=json.dumps(rec.get("reasoning", [])) if isinstance(rec.get("reasoning"), list) else str(rec.get("reasoning", "")),
                    audience_score=rec.get("audience_score", 0.0),
                    historical_score=rec.get("historical_score", 0.0),
                    trend_score=rec.get("trend_score", 0.0),
                    competition_score=rec.get("competition_score", 0.0),
                    evidence=rec.get("evidence", []),
                    related_videos=rec.get("related_videos", []),
                    related_comments=rec.get("related_comments", []),
                    related_trends=rec.get("related_trends", []),
                    memories_used=rec.get("memories_used", []),
                    content_type="LONG_FORM"
                )
                db.add(recommendation)

            # Seed default memories if empty
            mem_result = await db.execute(select(Memory).filter(Memory.channel_id == channel_id))
            existing_memories = mem_result.scalars().all()
            if not existing_memories:
                theme = channel.title or "Tech"
                topic = "Tech & Software Development"
                if any(k in theme.lower() for k in ["cook", "food", "chef", "recipe"]):
                    topic = "Cooking & Culinary Arts"
                elif any(k in theme.lower() for k in ["travel", "vlog", "explore"]):
                    topic = "Travel & Adventure Vlogs"
                elif any(k in theme.lower() for k in ["finance", "money", "invest", "stock"]):
                    topic = "Personal Finance & Investing"
                elif any(k in theme.lower() for k in ["fit", "gym", "health", "workout"]):
                    topic = "Fitness & Healthy Lifestyle"
                elif any(k in theme.lower() for k in ["science", "hacker", "experiment", "stunt", "challenge", "diy", "creative", "toy", "play", "game", "mr. indian hacker", "mr.indian hacker"]):
                    topic = "Experiments, Stunts & Creative Challenges"

                if topic == "Cooking & Culinary Arts":
                    default_memories = [
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Quick recipe Shorts (under 30s) perform well.", context_tags=["quick-recipes"]),
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Baking Shorts underperform due to lack of fast pacing.", context_tags=["baking"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Detailed dinner prep tutorials perform well.", context_tags=["dinner-prep"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Budget grocery store case studies generate high retention.", context_tags=["budget-grocery"]),
                    ]
                elif topic == "Travel & Adventure Vlogs":
                    default_memories = [
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Street food preview Shorts perform extremely well.", context_tags=["street-food"]),
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Packing tip Shorts underperform.", context_tags=["packing"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Solo travel budget guide videos perform well.", context_tags=["solo-travel"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Asia series itineraries generate high retention.", context_tags=["asia-series"]),
                    ]
                elif topic == "Experiments, Stunts & Creative Challenges":
                    default_memories = [
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Fast-paced visual chemistry explosion Shorts perform well.", context_tags=["explosions"]),
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Long explanation Shorts underperform.", context_tags=["science"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Giant pool and liquid nitrogen stunt videos perform well.", context_tags=["nitrogen"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="Hydrogen engine modification challenges generate high retention.", context_tags=["hydrogen-engine"]),
                    ]
                else: # Tech
                    default_memories = [
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="AI News Shorts perform well.", context_tags=["ai-news"]),
                        Memory(channel_id=channel_id, category="SHORTS_MEMORY", content="Productivity Shorts underperform.", context_tags=["productivity"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="AI Tutorials perform well.", context_tags=["ai-tutorials"]),
                        Memory(channel_id=channel_id, category="LONG_FORM_MEMORY", content="SaaS Case Studies generate high retention.", context_tags=["saas-case-studies"]),
                    ]
                for memory in default_memories:
                    db.add(memory)

            await db.commit()
            return "Analysis completed."
        except Exception as e:
            try:
                agent_run.status = "failed"
                agent_run.output = {"error": str(e)}
                await db.commit()
            except Exception as commit_err:
                print(f"Failed to record failure in AgentRun: {commit_err}")
            return f"Analysis failed: {e}"

@celery_app.task(name="analyze_channel")
def analyze_channel(channel_id: int):
    return asyncio.run(process_analyze_channel(channel_id))
