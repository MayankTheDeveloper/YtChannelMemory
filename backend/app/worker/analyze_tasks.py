import asyncio
from app.worker.celery_app import celery_app
from app.db.session import SessionLocal
from app.db.models import Channel, Video, Comment, AudienceInsight, Recommendation, AgentRun
from sqlalchemy import select
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
        
        try:
            final_state = await app_workflow.ainvoke(initial_state)
            
            # Save Agent Run
            agent_run = AgentRun(
                user_id=channel.user_id,
                agent_type="channel_analysis",
                status="completed",
                output={
                    "comment_insights": final_state.get("comment_insights", {}),
                    "audience_insights": final_state.get("audience_insights", {}),
                    "video_insights": final_state.get("video_insights", {}),
                    "competitor_insights": final_state.get("competitor_insights", {}),
                    "trend_insights": final_state.get("trend_insights", {})
                }
            )
            db.add(agent_run)
            
            # Calculate Channel Health Score
            health_score = 50.0
            if comment_data:
                health_score += 20.0
            if video_data:
                health_score += 30.0
            channel.health_score = health_score
            
            # Save Audience Insights
            audience_insight = AudienceInsight(
                channel_id=channel_id,
                personas=final_state.get("audience_insights", {}).get("personas", []),
                pain_points=final_state.get("audience_insights", {}).get("pain_points", []),
                interests=final_state.get("audience_insights", {}).get("interests", []),
                content_gaps=final_state.get("competitor_insights", {}).get("content_gaps", []),
                requested_topics=final_state.get("audience_insights", {}).get("requested_topics", [])
            )
            db.add(audience_insight)
            
            # Save Recommendations
            for rec in final_state.get("recommendations", []):
                recommendation = Recommendation(
                    channel_id=channel_id,
                    suggested_title=rec.get("title", ""),
                    confidence_score=rec.get("confidence_score", 0.0),
                    audience_match_score=rec.get("audience_score", 0.0),
                    reasoning=json.dumps(rec.get("reasoning", [])),
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
            agent_run.status = "failed"
            agent_run.output = {"error": str(e)}
            await db.commit()
            return f"Analysis failed: {e}"

@celery_app.task(name="analyze_channel")
def analyze_channel(channel_id: int):
    return asyncio.run(process_analyze_channel(channel_id))
