from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.api.deps import get_db, get_current_user
from app.db.models import User, Competitor

router = APIRouter()

class CompetitorCreate(BaseModel):
    competitor_channel_id: str
    title: str
    url: str

@router.post("")
async def add_competitor(
    competitor_data: CompetitorCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    comp = Competitor(
        user_id=current_user.id,
        competitor_channel_id=competitor_data.competitor_channel_id,
        title=competitor_data.title,
        url=competitor_data.url
    )
    db.add(comp)
    await db.commit()
    await db.refresh(comp)
    return comp

@router.get("")
async def get_competitors(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Competitor).filter(Competitor.user_id == current_user.id))
    return result.scalars().all()
