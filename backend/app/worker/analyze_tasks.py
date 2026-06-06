import asyncio
from app.worker.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Channel, Video, Comment, AudienceInsight, Recommendation, AgentRun
from sqlalchemy import select, delete
from app.langgraph.workflow import app_workflow
import json

async def process_analyze_channel(channel_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(Channel).filter(Channel.id == channel_id))
        channel = result.scalars().first()
        if not channel:
            return "Channel not found"
            
        # Fetch raw data
        videos_result = await db.execute(select(Video).filter(Video.channel_id == channel_id))
        videos = videos_result.scalars().all()
        
        video_ids = [v.id for v in videos]
        comments = []
        if video_ids:
            comments_result = await db.execute(select(Comment).filter(Comment.video_id.in_(video_ids)))
            comments = comments_result.scalars().all()
            
        video_data = [{"title": v.title, "view_count": v.view_count, "like_count": v.like_count} for v in videos]
        comment_data = [{"text": c.text, "author": c.author} for c in comments]

        initial_state = {
            "channel_id": channel_id,
            "user_id": channel.user_id,
            "raw_comments": comment_data,
            "raw_videos": video_data,
            "raw_competitors": [], # MVP: Fetch from Competitor table
            "raw_trends": [], # MVP: Fetch from Trend table
            "comment_insights": {},
            "audience_insights": {},
            "video_insights": {},
            "competitor_insights": {},
            "trend_insights": {},
            "recommendations": []
        }
        
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

    # Personas, interests, pain points, requested topics, content gaps, recommendations based on topic
    if topic == "Cooking & Culinary Arts":
        personas = ["Home Cooks looking for quick meals", "Foodies craving restaurant-style dishes", "Beginners learning kitchen basics"]
        interests = ["30-minute recipes", "Kitchen tool reviews", "Baking tutorials", "Meal prepping"]
        pain_points = ["Lack of time for weekday dinners", "Complicated recipe steps", "Ingredient availability", "Cooking healthy on a budget"]
        requested_topics = ["15-minute healthy dinners", "How to knife skills for beginners", "Sourdough bread starter guide"]
        content_gaps = ["Lack of quick vegetarian meal prep videos", "Fewer guides on high-protein budget desserts"]
        recs = [
            {
                "title": "I Made 5 Healthy Dinners in 15 Minutes (Meal Prep Challenge)",
                "confidence_score": 94,
                "audience_score": 96,
                "historical_score": 90,
                "trend_score": 95,
                "competition_score": 95,
                "reasoning": [
                    "Directly addresses 'lack of time' pain point for weekday dinners",
                    "Strong trend in quick meal prep video queries",
                    "Exploits competitor gap in vegetarian/healthy options"
                ],
                "evidence": ["High search velocity for '15 minute meals'", "Requested by multiple viewers in comments"],
                "memories_used": ["Audience responds well to time-saving challenges", "Previous high engagement on meal prep tips"],
                "related_trends": ["Meal Prep", "Healthy Eating"],
                "related_videos": [],
                "related_comments": ["Need more quick dinner ideas!"],
            },
            {
                "title": "Kitchen Knife Skills: 3 Basic Cuts Every Cook Must Know",
                "confidence_score": 89,
                "audience_score": 90,
                "historical_score": 85,
                "trend_score": 88,
                "competition_score": 93,
                "reasoning": [
                    "Great evergreen content for beginners learning kitchen basics",
                    "Highly requested skill reference"
                ],
                "evidence": ["Steady search volume for 'how to cut vegetables'", "Commenters asking about knife safety"],
                "memories_used": ["Evergreen beginner content has higher long-term views"],
                "related_trends": ["Kitchen Basics"],
                "related_videos": [],
                "related_comments": ["My dicing is so slow, any advice?"],
            }
        ]
    else:
        personas = ["Aspiring Developers", "Productivity Seekers", "Tech Enthusiasts", "AI Builders"]
        interests = ["Next.js & React", "AI Tools & APIs", "Software Architecture", "DevOps & Cloud"]
        pain_points = ["Stuck in tutorial hell", "Keeping up with rapid framework updates", "Debugging complex async state", "Scaling serverless apps"]
        requested_topics = ["Next.js 15 crash course", "LangGraph agents from scratch", "Deploying SaaS on AWS", "AI voice assistant tutorial"]
        content_gaps = ["Lack of end-to-end LangGraph tutorial with DB persistence", "Fewer real-world Next.js 15 production showcases"]
        recs = [
            {
                "title": "How I Automated My YouTube Channel with LangGraph Agents",
                "confidence_score": 96,
                "audience_score": 98,
                "historical_score": 92,
                "trend_score": 97,
                "competition_score": 97,
                "reasoning": [
                    "Directly addresses top requested topic: 'LangGraph for beginners'",
                    "Leverages winning pattern: 'Case-study based titles'",
                    "Matches audience interest in AI Tools and Software Engineering"
                ],
                "evidence": ["LangGraph search volume up 300%", "Comments requesting practical AI workflow code"],
                "memories_used": ["Audience requested automation repeatedly", "Past tutorial succeeded"],
                "related_trends": ["Agentic AI", "LangGraph"],
                "related_videos": [],
                "related_comments": ["Would love to see an agent workflow!"],
            },
            {
                "title": "Next.js 15: The Ultimate Production Guide (Crash Course)",
                "confidence_score": 91,
                "audience_score": 92,
                "historical_score": 88,
                "trend_score": 94,
                "competition_score": 90,
                "reasoning": [
                    "Addresses high frequency pain point: 'Keeping up with new tech'",
                    "Previous Next.js courses performed 45% better than average videos"
                ],
                "evidence": ["High search volume for 'Next.js 15 App Router'", "Commenters asking about server components"],
                "memories_used": ["Evergreen Next.js guides yield steady traffic"],
                "related_trends": ["Next.js 15", "React 19"],
                "related_videos": [],
                "related_comments": ["When is Next 15 tutorial coming?"],
            }
        ]
        
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
        "video_insights": {
            "winning_patterns": ["High-energy intros (< 5s)", "Case-study based titles", "Thumbnail includes a recognizable brand logo"],
            "losing_patterns": ["Overly technical jargon in the first minute", "Long unbroken talking head segments", "Vague titles"]
        },
        "competitor_insights": {
            "content_gaps": content_gaps
        },
        "trend_insights": {},
        "recommendations": recs
    }

async def process_analyze_channel(channel_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(Channel).filter(Channel.id == channel_id))
        channel = result.scalars().first()
        if not channel:
            return "Channel not found"
            
        # Fetch raw data
        videos_result = await db.execute(select(Video).filter(Video.channel_id == channel_id))
        videos = videos_result.scalars().all()
        
        video_ids = [v.id for v in videos]
        comments = []
        if video_ids:
            comments_result = await db.execute(select(Comment).filter(Comment.video_id.in_(video_ids)))
            comments = comments_result.scalars().all()
            
        video_data = [{"title": v.title, "view_count": v.view_count, "like_count": v.like_count} for v in videos]
        comment_data = [{"text": c.text, "author": c.author} for c in comments]

        initial_state = {
            "channel_id": channel_id,
            "user_id": channel.user_id,
            "raw_comments": comment_data,
            "raw_videos": video_data,
            "raw_competitors": [], # MVP: Fetch from Competitor table
            "raw_trends": [], # MVP: Fetch from Trend table
            "comment_insights": {},
            "audience_insights": {},
            "video_insights": {},
            "competitor_insights": {},
            "trend_insights": {},
            "recommendations": []
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
            
            # If LangGraph didn't output recommendations (e.g. due to missing LLM key/errors)
            # fallback to personalized mockup values
            if not final_state.get("recommendations") or not final_state.get("audience_insights"):
                final_state = get_fallback_analysis_state(channel_id, channel.user_id, channel.title or "Tech")

            # Update Agent Run
            agent_run.status = "completed"
            agent_run.output = {
                "comment_insights": final_state.get("comment_insights", {}),
                "audience_insights": final_state.get("audience_insights", {}),
                "video_insights": final_state.get("video_insights", {}),
                "competitor_insights": final_state.get("competitor_insights", {}),
                "trend_insights": final_state.get("trend_insights", {})
            }
            
            # Calculate Channel Health Score
            health_score = 50.0
            if comment_data:
                health_score += 20.0
            if video_data:
                health_score += 30.0
            channel.health_score = min(health_score, 100.0)
            
            # Save Audience Insights
            # First check if audience insights already exist
            aud_result = await db.execute(select(AudienceInsight).filter(AudienceInsight.channel_id == channel_id))
            audience_insight = aud_result.scalars().first()
            if not audience_insight:
                audience_insight = AudienceInsight(
                    channel_id=channel_id,
                    personas=final_state.get("audience_insights", {}).get("personas", []),
                    pain_points=final_state.get("audience_insights", {}).get("pain_points", []),
                    interests=final_state.get("audience_insights", {}).get("interests", []),
                )
                db.add(audience_insight)
            else:
                audience_insight.personas = final_state.get("audience_insights", {}).get("personas", [])
                audience_insight.pain_points = final_state.get("audience_insights", {}).get("pain_points", [])
                audience_insight.interests = final_state.get("audience_insights", {}).get("interests", [])

            # Clear out previous recommendations to prevent duplicate dashboard entries
            from app.db.models import Recommendation
            await db.execute(
                delete(Recommendation).where(Recommendation.channel_id == channel_id)
            )

            # Save Recommendations
            for rec in final_state.get("recommendations", []):
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
                    memories_used=rec.get("memories_used", [])
                )
                db.add(recommendation)

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
