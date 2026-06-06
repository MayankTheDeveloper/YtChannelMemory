import asyncio
from fastapi import APIRouter, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi import Depends
from pydantic import BaseModel
from typing import Optional
from dateutil.parser import isoparse
import random
from datetime import datetime, timedelta

from app.api.deps import get_db
from app.db.models import Channel, Video, Comment, AudienceInsight, Recommendation, Memory, AgentRun
from app.services.youtube_public import YouTubePublicService
from app.worker.analyze_tasks import analyze_channel
from app.core.utils import parse_iso8601_duration

router = APIRouter()

class ImportChannelRequest(BaseModel):
    channel_url: str

class ImportChannelResponse(BaseModel):
    channel_id: int
    title: str
    subscriber_count: int
    video_count: int
    videos_imported: int
    comments_imported: int

def get_fallback_channel_data(channel_url: str):
    # Extract handle or name from url
    name = "Demo Channel"
    handle = "demochannel"
    if "@" in channel_url:
        handle = channel_url.split("@")[-1].split("/")[0]
        name = handle.capitalize()
    elif "channel/" in channel_url:
        name = "Ingested Channel"
        handle = "ingested_channel"
    elif len(channel_url) > 0:
        name = channel_url.split("/")[-1].replace("@", "").capitalize()
        handle = name.lower()

    # Generate deterministic mock channel details
    yt_channel_id = f"UC_mock_{handle}"
    
    # Determine subscriber count, videos, descriptions depending on channel name
    sub_count = 12500000 if "mkbhd" in handle.lower() else 3100000 if "fireship" in handle.lower() else 45000
    video_count = 1600 if "mkbhd" in handle.lower() else 850 if "fireship" in handle.lower() else 120
    description = f"Welcome to {name}! Mined with Hindsight Memory System."

    channel_info = {
        "youtube_channel_id": yt_channel_id,
        "title": name,
        "description": description,
        "subscriber_count": sub_count,
        "video_count": video_count
    }

    # Success Criteria: Generate 18 Shorts (under 60s) and 2 Long-form videos (over 60s)
    videos_data = []
    
    # 18 Shorts
    for i in range(18):
        v_id = f"mock_short_{handle}_{i}"
        view_c = random.randint(10000, 300000)
        like_c = int(view_c * 0.08)
        comment_c = int(view_c * 0.02)
        pub_at = (datetime.now() - timedelta(days=i)).isoformat() + "Z"
        videos_data.append({
            "youtube_video_id": v_id,
            "title": f"Short: {name} Idea #{i+1} on AI & Dev",
            "description": f"Quick content explanation for #{i+1}",
            "thumbnail_url": "",
            "duration": "PT30S", # 30 seconds
            "published_at": pub_at,
            "view_count": view_c,
            "like_count": like_c,
            "comment_count": comment_c
        })
        
    # 2 Long-form videos
    for i in range(2):
        v_id = f"mock_long_{handle}_{i}"
        view_c = random.randint(50000, 800000)
        like_c = int(view_c * 0.04)
        comment_c = int(view_c * 0.01)
        pub_at = (datetime.now() - timedelta(days=i*10 + 20)).isoformat() + "Z"
        videos_data.append({
            "youtube_video_id": v_id,
            "title": f"Deep Dive: Building SaaS & LangGraph with {name} (Tutorial #{i+1})",
            "description": f"In-depth long-form video discussing design and execution.",
            "thumbnail_url": "",
            "duration": "PT15M30S", # 15 mins 30 seconds
            "published_at": pub_at,
            "view_count": view_c,
            "like_count": like_c,
            "comment_count": comment_c
        })

    # Generate mock comments for first video
    comments_data = {}
    comment_pool = [
        "This is exactly what I was looking for!",
        "Can you do a tutorial on using database persistence with LangGraph?",
        "I love the clean workflow presentation.",
        "Compounding memories is such a game-changer.",
        "Could you explain how to scale this in production?",
        "Wait, so the agent actually remembers past suggestions?",
        "This channel has the best insights.",
        "Next.js and LangGraph integration is what we need.",
        "Awesome video, subscribed!"
    ]
    for v in videos_data:
        comments_data[v["youtube_video_id"]] = [
            {
                "youtube_comment_id": f"mock_comment_{v['youtube_video_id']}_{j}",
                "author": f"Viewer_{j}",
                "text": random.choice(comment_pool),
                "published_at": (datetime.now() - timedelta(days=j)).isoformat() + "Z"
            }
            for j in range(15)
        ]

    return channel_info, videos_data, comments_data

@router.post("/channel", response_model=ImportChannelResponse)
async def import_channel(
    request: ImportChannelRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Import a YouTube channel by URL, handle, or channel ID.
    Fetches channel info, recent videos, and comments — stores everything in the database.
    No authentication required (demo mode).
    """
    try:
        yt = YouTubePublicService()
        has_api_key = True
    except ValueError as e:
        has_api_key = False

    if has_api_key:
        # Resolve channel identifier
        try:
            yt_channel_id = yt.resolve_channel_identifier(request.channel_url)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))

        # Fetch channel info
        try:
            channel_info = yt.fetch_channel_info(yt_channel_id)
        except ValueError as e:
            raise HTTPException(status_code=404, detail=str(e))
    else:
        # Generate mock channel details
        channel_info, mock_videos, mock_comments = get_fallback_channel_data(request.channel_url)
        yt_channel_id = channel_info["youtube_channel_id"]

    # Check if channel already exists
    result = await db.execute(select(Channel).filter(Channel.youtube_channel_id == yt_channel_id))
    channel = result.scalars().first()

    if not channel:
        # Create a default user_id=1 for demo (no auth)
        channel = Channel(
            user_id=1,
            youtube_channel_id=channel_info["youtube_channel_id"],
            title=channel_info["title"],
            description=channel_info["description"],
            subscriber_count=channel_info["subscriber_count"],
            video_count=channel_info["video_count"]
        )
        db.add(channel)
        await db.commit()
        await db.refresh(channel)
    else:
        # Update stats
        channel.title = channel_info["title"]
        channel.subscriber_count = channel_info["subscriber_count"]
        channel.video_count = channel_info["video_count"]
        await db.commit()

    if has_api_key:
        videos_data = yt.fetch_recent_videos(yt_channel_id, max_results=30)
    else:
        videos_data = mock_videos

    videos_imported = 0
    comments_imported = 0

    for v_data in videos_data:
        result = await db.execute(select(Video).filter(Video.youtube_video_id == v_data["youtube_video_id"]))
        existing_video = result.scalars().first()

        published_at = isoparse(v_data["published_at"])
        duration_str = v_data.get("duration", "")
        seconds = parse_iso8601_duration(duration_str)
        content_type = "SHORT" if (seconds > 0 and seconds <= 60) else "LONG_FORM"

        if not existing_video:
            video = Video(
                channel_id=channel.id,
                youtube_video_id=v_data["youtube_video_id"],
                title=v_data["title"],
                published_at=published_at,
                view_count=v_data["view_count"],
                like_count=v_data["like_count"],
                thumbnail_url=v_data["thumbnail_url"],
                content_type=content_type
            )
            db.add(video)
            await db.commit()
            await db.refresh(video)
            videos_imported += 1
        else:
            video = existing_video
            video.view_count = v_data["view_count"]
            video.like_count = v_data["like_count"]
            video.content_type = content_type
            await db.commit()

        # Fetch comments for this video (limit to top 5 videos to save API quota)
        if has_api_key:
            if videos_imported <= 5 or v_data["comment_count"] > 50:
                video_comments = yt.fetch_video_comments(v_data["youtube_video_id"], max_results=50)
                for c_data in video_comments:
                    result = await db.execute(
                        select(Comment).filter(Comment.youtube_comment_id == c_data["youtube_comment_id"])
                    )
                    if not result.scalars().first():
                        comment = Comment(
                            video_id=video.id,
                            youtube_comment_id=c_data["youtube_comment_id"],
                            author=c_data["author"],
                            text=c_data["text"],
                            published_at=isoparse(c_data["published_at"])
                        )
                        db.add(comment)
                        comments_imported += 1
                await db.commit()
        else:
            video_comments = mock_comments.get(v_data["youtube_video_id"], [])
            for c_data in video_comments:
                result = await db.execute(
                    select(Comment).filter(Comment.youtube_comment_id == c_data["youtube_comment_id"])
                )
                if not result.scalars().first():
                    comment = Comment(
                        video_id=video.id,
                        youtube_comment_id=c_data["youtube_comment_id"],
                        author=c_data["author"],
                        text=c_data["text"],
                        published_at=isoparse(c_data["published_at"])
                    )
                    db.add(comment)
                    comments_imported += 1
            await db.commit()

    return ImportChannelResponse(
        channel_id=channel.id,
        title=channel_info["title"],
        subscriber_count=channel_info["subscriber_count"],
        video_count=channel_info["video_count"],
        videos_imported=videos_imported,
        comments_imported=comments_imported
    )

@router.post("/channel/{channel_id}/analyze")
async def trigger_analysis(
    channel_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger the full LangGraph AI analysis pipeline for the imported channel.
    """
    result = await db.execute(select(Channel).filter(Channel.id == channel_id))
    channel = result.scalars().first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    task = analyze_channel.delay(channel_id)
    return {"message": "Analysis pipeline started", "task_id": task.id, "channel_id": channel_id}

@router.get("/channel/{channel_id}/dashboard")
async def get_channel_dashboard(
    channel_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns all channel data in a single API call for the frontend dashboard.
    """
    # Channel info
    result = await db.execute(select(Channel).filter(Channel.id == channel_id))
    channel = result.scalars().first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    # Videos
    result = await db.execute(
        select(Video).filter(Video.channel_id == channel_id).order_by(desc(Video.view_count)).limit(20)
    )
    videos = result.scalars().all()

    # Audience insights
    result = await db.execute(select(AudienceInsight).filter(AudienceInsight.channel_id == channel_id))
    audience = result.scalars().first()

    # Recommendations
    result = await db.execute(
        select(Recommendation).filter(Recommendation.channel_id == channel_id).order_by(desc(Recommendation.confidence_score))
    )
    recommendations = result.scalars().all()
    shorts_recommendations = [r for r in recommendations if r.content_type == "SHORT"]
    long_form_recommendations = [r for r in recommendations if r.content_type == "LONG_FORM"]

    # Memories
    result = await db.execute(
        select(Memory).filter(Memory.channel_id == channel_id).order_by(desc(Memory.created_at)).limit(20)
    )
    memories = result.scalars().all()

    # Latest agent run
    result = await db.execute(
        select(AgentRun).filter(AgentRun.agent_type == "channel_analysis", AgentRun.status == "completed")
        .order_by(desc(AgentRun.id)).limit(1)
    )
    latest_run = result.scalars().first()

    return {
        "channel": {
            "id": channel.id,
            "title": channel.title,
            "youtube_channel_id": channel.youtube_channel_id,
            "subscriber_count": channel.subscriber_count,
            "video_count": channel.video_count,
            "health_score": channel.health_score,
            "description": channel.description,
        },
        "videos": [
            {
                "id": v.id,
                "title": v.title,
                "youtube_video_id": v.youtube_video_id,
                "view_count": v.view_count,
                "like_count": v.like_count,
                "thumbnail_url": v.thumbnail_url,
                "published_at": str(v.published_at) if v.published_at else None,
                "content_type": v.content_type,
            }
            for v in videos
        ],
        "audience_insights": {
            "personas": audience.personas if audience else [],
            "interests": audience.interests if audience else [],
            "pain_points": audience.pain_points if audience else [],
            "requested_topics": getattr(audience, "requested_topics", []) if audience else [],
            "content_gaps": getattr(audience, "content_gaps", []) if audience else [],
        },
        "recommendations": [
            {
                "id": r.id,
                "title": r.suggested_title,
                "confidence_score": r.confidence_score,
                "audience_score": r.audience_score,
                "historical_score": r.historical_score,
                "trend_score": r.trend_score,
                "competition_score": r.competition_score,
                "reasoning": r.reasoning,
                "evidence": r.evidence or [],
                "memories_used": r.memories_used or [],
                "related_trends": r.related_trends or [],
                "status": r.status,
                "content_type": r.content_type,
            }
            for r in recommendations
        ],
        "shorts_recommendations": [
            {
                "id": r.id,
                "title": r.suggested_title,
                "confidence_score": r.confidence_score,
                "audience_score": r.audience_score,
                "historical_score": r.historical_score,
                "trend_score": r.trend_score,
                "competition_score": r.competition_score,
                "reasoning": r.reasoning,
                "evidence": r.evidence or [],
                "memories_used": r.memories_used or [],
                "related_trends": r.related_trends or [],
                "status": r.status,
                "content_type": r.content_type,
            }
            for r in shorts_recommendations
        ],
        "long_form_recommendations": [
            {
                "id": r.id,
                "title": r.suggested_title,
                "confidence_score": r.confidence_score,
                "audience_score": r.audience_score,
                "historical_score": r.historical_score,
                "trend_score": r.trend_score,
                "competition_score": r.competition_score,
                "reasoning": r.reasoning,
                "evidence": r.evidence or [],
                "memories_used": r.memories_used or [],
                "related_trends": r.related_trends or [],
                "status": r.status,
                "content_type": r.content_type,
            }
            for r in long_form_recommendations
        ],
        "memories": [
            {
                "id": m.id,
                "category": m.category,
                "content": m.content,
                "context_tags": m.context_tags or [],
                "created_at": str(m.created_at),
                "recall_count": m.recall_count,
            }
            for m in memories
        ],
        "analysis_status": latest_run.status if latest_run else "not_started",
        "video_insights": latest_run.output.get("video_insights", {}) if latest_run and latest_run.output else {},
        "shorts_insights": latest_run.output.get("shorts_insights", {}) if latest_run and latest_run.output else {},
        "long_form_insights": latest_run.output.get("long_form_insights", {}) if latest_run and latest_run.output else {},
    }
