import asyncio
from typing import List, Dict, Any
from app.worker.celery_app import celery_app
from app.services.youtube import YouTubeIntegrationService
from app.db.session import SessionLocal
from app.db.models import User, Channel, Video, Comment
from sqlalchemy import select
from dateutil.parser import isoparse

async def process_sync_channel(user_id: int):
    async with SessionLocal() as db:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if not user or not user.youtube_credentials:
            return "User or credentials not found"
        
        youtube_svc = YouTubeIntegrationService(user.youtube_credentials)
        metadata = youtube_svc.fetch_channel_metadata()
        
        # Check if channel exists
        result = await db.execute(select(Channel).filter(Channel.youtube_channel_id == metadata["youtube_channel_id"]))
        channel = result.scalars().first()
        
        if not channel:
            channel = Channel(
                user_id=user.id,
                youtube_channel_id=metadata["youtube_channel_id"],
                title=metadata["title"],
                description=metadata["description"],
                subscriber_count=metadata["subscriber_count"],
                video_count=metadata["video_count"]
            )
            db.add(channel)
            await db.commit()
            await db.refresh(channel)
        else:
            channel.title = metadata["title"]
            channel.description = metadata["description"]
            channel.subscriber_count = metadata["subscriber_count"]
            channel.video_count = metadata["video_count"]
            await db.commit()
            
        # Spawn video sync
        sync_videos.delay(user.id, channel.id, metadata["youtube_channel_id"])
        return f"Channel {channel.title} synced."

async def process_sync_videos(user_id: int, db_channel_id: int, yt_channel_id: str):
    async with SessionLocal() as db:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if not user or not user.youtube_credentials:
            return
            
        youtube_svc = YouTubeIntegrationService(user.youtube_credentials)
        videos_data = youtube_svc.fetch_videos(yt_channel_id, max_results=50) # Limit for MVP
        
        for v_data in videos_data:
            result = await db.execute(select(Video).filter(Video.youtube_video_id == v_data["youtube_video_id"]))
            video = result.scalars().first()
            
            published_at = isoparse(v_data["published_at"])
            
            if not video:
                video = Video(
                    channel_id=db_channel_id,
                    youtube_video_id=v_data["youtube_video_id"],
                    title=v_data["title"],
                    published_at=published_at,
                    view_count=v_data["view_count"],
                    like_count=v_data["like_count"],
                    thumbnail_url=v_data["thumbnail_url"]
                )
                db.add(video)
                await db.commit()
                await db.refresh(video)
            else:
                video.view_count = v_data["view_count"]
                video.like_count = v_data["like_count"]
                await db.commit()
                
            # Spawn comment sync
            sync_comments.delay(user_id, video.id, v_data["youtube_video_id"])
            
        return f"Synced {len(videos_data)} videos for channel {db_channel_id}."

async def process_sync_comments(user_id: int, db_video_id: int, yt_video_id: str):
    async with SessionLocal() as db:
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalars().first()
        if not user or not user.youtube_credentials:
            return
            
        youtube_svc = YouTubeIntegrationService(user.youtube_credentials)
        comments_data = youtube_svc.fetch_comments(yt_video_id, max_results=100) # Limit for MVP
        
        for c_data in comments_data:
            result = await db.execute(select(Comment).filter(Comment.youtube_comment_id == c_data["youtube_comment_id"]))
            comment = result.scalars().first()
            
            published_at = isoparse(c_data["published_at"])
            
            if not comment:
                comment = Comment(
                    video_id=db_video_id,
                    youtube_comment_id=c_data["youtube_comment_id"],
                    author=c_data["author"],
                    text=c_data["text"],
                    published_at=published_at
                )
                db.add(comment)
            else:
                comment.text = c_data["text"]
                
        await db.commit()
        return f"Synced {len(comments_data)} comments for video {db_video_id}."

@celery_app.task(name="sync_channel")
def sync_channel(user_id: int):
    return asyncio.run(process_sync_channel(user_id))

@celery_app.task(name="sync_videos")
def sync_videos(user_id: int, db_channel_id: int, yt_channel_id: str):
    return asyncio.run(process_sync_videos(user_id, db_channel_id, yt_channel_id))

@celery_app.task(name="sync_comments")
def sync_comments(user_id: int, db_video_id: int, yt_video_id: str):
    return asyncio.run(process_sync_comments(user_id, db_video_id, yt_video_id))
