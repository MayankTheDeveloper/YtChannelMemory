from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from fastapi_cache.decorator import cache
from fastapi_limiter.depends import RateLimiter

from app.api.deps import get_db, get_current_user
from app.db.models import User, Channel, AudienceInsight, Recommendation, AgentRun
from app.worker.analyze_tasks import analyze_channel

router = APIRouter()

@router.post("/{channel_id}/analyze", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def trigger_channel_analysis(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Channel).filter(Channel.id == channel_id, Channel.user_id == current_user.id))
    if not result.scalars().first():
        raise HTTPException(status_code=404, detail="Channel not found")
        
    task = analyze_channel.delay(channel_id)
    return {"message": "Analysis started", "task_id": task.id}

@router.get("/{channel_id}/audience-insights", dependencies=[Depends(RateLimiter(times=20, seconds=60))])
@cache(expire=300)
async def get_audience_insights(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AudienceInsight).filter(AudienceInsight.channel_id == channel_id))
    insight = result.scalars().first()
    if not insight:
        return {"interests": [], "personas": [], "pain_points": [], "requested_topics": []}
    return insight

@router.get("/{channel_id}/recommendations", dependencies=[Depends(RateLimiter(times=20, seconds=60))])
@cache(expire=300)
async def get_recommendations(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Recommendation).filter(Recommendation.channel_id == channel_id))
    recommendations = result.scalars().all()
    return recommendations

@router.get("/{channel_id}/comment-insights", dependencies=[Depends(RateLimiter(times=20, seconds=60))])
@cache(expire=300)
async def get_comment_insights(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch from the latest AgentRun output for this user's channel
    result = await db.execute(
        select(AgentRun)
        .filter(AgentRun.user_id == current_user.id, AgentRun.agent_type == "channel_analysis", AgentRun.status == "completed")
        .order_by(desc(AgentRun.id))
    )
    run = result.scalars().first()
    if run and run.output:
        return run.output.get("comment_insights", {})
    return {}

@router.get("/{channel_id}/video-insights")
async def get_video_insights(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch from the latest AgentRun output
    result = await db.execute(
        select(AgentRun)
        .filter(AgentRun.user_id == current_user.id, AgentRun.agent_type == "channel_analysis", AgentRun.status == "completed")
        .order_by(desc(AgentRun.id))
    )
    run = result.scalars().first()
    if run and run.output:
        return run.output.get("video_insights", {})
    return {}

@router.get("/shorts")
async def get_shorts_insights(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch from the latest AgentRun output
    result = await db.execute(
        select(AgentRun)
        .filter(AgentRun.user_id == current_user.id, AgentRun.agent_type == "channel_analysis", AgentRun.status == "completed")
        .order_by(desc(AgentRun.id))
    )
    run = result.scalars().first()
    if run and run.output:
        return run.output.get("shorts_insights", {})
    return {}

@router.get("/long-form")
async def get_long_form_insights(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch from the latest AgentRun output
    result = await db.execute(
        select(AgentRun)
        .filter(AgentRun.user_id == current_user.id, AgentRun.agent_type == "channel_analysis", AgentRun.status == "completed")
        .order_by(desc(AgentRun.id))
    )
    run = result.scalars().first()
    if run and run.output:
        return run.output.get("long_form_insights", {})
    return {}
