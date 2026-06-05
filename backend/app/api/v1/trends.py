from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.db.models import User, Trend

router = APIRouter()

@router.get("")
async def get_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Trend))
    return result.scalars().all()

@router.get("/opportunities")
async def get_trend_opportunities(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # In a real app, we would query the trend_insights from the latest AgentRun
    # For MVP, we return dummy emerging topics based on db trends
    result = await db.execute(select(Trend).filter(Trend.momentum_score > 0.5))
    high_momentum = result.scalars().all()
    return {
        "emerging_topics": [t.keyword for t in high_momentum]
    }
