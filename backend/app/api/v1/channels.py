from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.db.models import User, Channel
from app.worker.tasks import sync_channel

router = APIRouter()

@router.post("/{channel_id}/sync")
async def trigger_channel_sync(
    channel_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify channel belongs to user
    result = await db.execute(select(Channel).filter(Channel.id == channel_id, Channel.user_id == current_user.id))
    channel = result.scalars().first()
    
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found or not owned by user")
        
    # Trigger Celery task
    task = sync_channel.delay(current_user.id)
    return {"message": "Sync started", "task_id": task.id}

@router.get("/me")
async def get_my_channels(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Channel).filter(Channel.user_id == current_user.id))
    channels = result.scalars().all()
    return channels

@router.post("/sync-initial")
async def trigger_initial_sync(
    current_user: User = Depends(get_current_user)
):
    """
    Trigger sync without knowing channel ID yet (used after OAuth)
    """
    if not current_user.youtube_credentials:
        raise HTTPException(status_code=400, detail="No YouTube credentials found")
        
    task = sync_channel.delay(current_user.id)
    return {"message": "Initial sync started", "task_id": task.id}
