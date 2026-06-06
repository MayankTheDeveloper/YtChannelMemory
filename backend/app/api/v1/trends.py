from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db, get_current_user
from app.db.models import User, Trend

router = APIRouter()

from typing import Optional
import json
from app.db.models import User, Trend, Recommendation

@router.get("")
async def get_trends(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Trend))
    return result.scalars().all()

@router.get("/opportunities")
async def get_trend_opportunities(
    channel_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if channel_id:
        result = await db.execute(
            select(Recommendation).filter(Recommendation.channel_id == channel_id)
        )
        recs = result.scalars().all()
        
        shorts_opportunities = []
        long_form_opportunities = []
        
        for r in recs:
            try:
                reasoning_val = json.loads(r.reasoning) if (r.reasoning and r.reasoning.strip().startswith("[")) else [r.reasoning]
            except Exception:
                reasoning_val = [r.reasoning] if r.reasoning else []
                
            opp = {
                "title": r.suggested_title,
                "score": r.confidence_score,
                "reasoning": reasoning_val,
                "supporting_evidence": r.evidence or [],
                "memory_references": r.memories_used or []
            }
            if r.content_type == "SHORT":
                shorts_opportunities.append(opp)
            else:
                long_form_opportunities.append(opp)
                
        return {
            "shorts_opportunities": shorts_opportunities,
            "long_form_opportunities": long_form_opportunities
        }

    # Fallback to general trends if no channel_id provided
    result = await db.execute(select(Trend).filter(Trend.momentum_score > 0.5))
    high_momentum = result.scalars().all()
    return {
        "emerging_topics": [t.keyword for t in high_momentum]
    }
