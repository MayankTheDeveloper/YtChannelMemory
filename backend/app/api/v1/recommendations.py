from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.api.deps import get_db, get_current_user
from app.db.models import User, Recommendation

router = APIRouter()

@router.get("/shorts")
async def get_shorts_recommendations(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Recommendation).filter(
            Recommendation.channel_id == channel_id,
            Recommendation.content_type == "SHORT"
        )
    )
    return result.scalars().all()

@router.get("/long-form")
async def get_long_form_recommendations(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Recommendation).filter(
            Recommendation.channel_id == channel_id,
            Recommendation.content_type == "LONG_FORM"
        )
    )
    return result.scalars().all()
