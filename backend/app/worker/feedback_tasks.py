import asyncio
from celery import shared_task
from app.db.session import SessionLocal
from app.db.models import PublishHistory, PredictionAccuracy, GeneratedVideo, Storyboard, Script, ContentBrief, Recommendation
from sqlalchemy import select
from app.memory.memory_service import memory_service
from app.memory.memory_models import MemoryCreate
from datetime import datetime, timezone

async def process_post_publish_analytics(publish_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(PublishHistory).filter(PublishHistory.id == publish_id))
        publish_record = result.scalars().first()
        
        if not publish_record or not publish_record.youtube_video_id:
            return "No valid YouTube Video ID found."

        # Fetch actual views from YouTube API (Mock)
        print(f"Fetching analytics for YouTube Video {publish_record.youtube_video_id}...")
        actual_views = 5000 
        
        # Navigate relationships to find original recommendation ID
        try:
            vid_res = await db.execute(select(GeneratedVideo).filter(GeneratedVideo.id == publish_record.video_id))
            vid = vid_res.scalars().first()
            
            storyboard_res = await db.execute(select(Storyboard).filter(Storyboard.id == vid.storyboard_id))
            storyboard = storyboard_res.scalars().first()
            
            script_res = await db.execute(select(Script).filter(Script.id == storyboard.script_id))
            script = script_res.scalars().first()
            
            brief_res = await db.execute(select(ContentBrief).filter(ContentBrief.id == script.brief_id))
            brief = brief_res.scalars().first()
            
            rec_res = await db.execute(select(Recommendation).filter(Recommendation.id == brief.recommendation_id))
            rec = rec_res.scalars().first()
            
            channel_id = rec.channel_id
            rec_title = rec.suggested_title
        except Exception as e:
            print(f"Could not trace recommendation: {e}")
            return "Error tracing recommendation."

        predicted_views = 4500
        accuracy_score = 1.0 - (abs(actual_views - predicted_views) / max(actual_views, predicted_views))
        
        accuracy = PredictionAccuracy(
            publish_id=publish_id,
            predicted_views=predicted_views,
            actual_views=actual_views,
            accuracy_score=accuracy_score
        )
        db.add(accuracy)
        
        # Phase 3: Hindsight Memory Loop
        memory_content = f"Recommendation '{rec_title}' resulted in {actual_views} actual views (Accuracy: {accuracy_score*100:.1f}%). Learning: Audience responded positively to this topic."
        
        mem_in = MemoryCreate(
            channel_id=channel_id,
            category="Recommendation",
            content=memory_content,
            context_tags=["post_publish_feedback", "high_accuracy"] if accuracy_score > 0.8 else ["post_publish_feedback", "low_accuracy"]
        )
        await memory_service.retain_memory(db, mem_in)
        
        await db.commit()
        return "Feedback loop executed and memory retained."

@shared_task(name="collect_post_publish_analytics")
def collect_post_publish_analytics(publish_id: int):
    return asyncio.run(process_post_publish_analytics(publish_id))
