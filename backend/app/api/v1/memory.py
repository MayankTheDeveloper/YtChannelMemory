from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.api.deps import get_db, get_current_user
from app.db.models import User
from app.memory.memory_service import memory_service
from app.memory.memory_models import MemorySearch, MemoryRead

router = APIRouter()

@router.get("/", response_model=List[MemoryRead])
async def get_memories(
    channel_id: int,
    category: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search_params = MemorySearch(
        channel_id=channel_id,
        category=category,
        limit=limit
    )
    return await memory_service.recall_memories(db, search_params)

@router.post("/search", response_model=List[MemoryRead])
async def search_memories(
    search_params: MemorySearch,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await memory_service.recall_memories(db, search_params)

@router.get("/context/{channel_id}")
async def get_memory_context(
    channel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    context = await memory_service.build_memory_context(db, channel_id)
    return {"context": context}

@router.get("/shorts", response_model=List[MemoryRead])
async def get_shorts_memories(
    channel_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search_params = MemorySearch(
        channel_id=channel_id,
        category="SHORTS_MEMORY",
        limit=limit
    )
    return await memory_service.recall_memories(db, search_params)

@router.get("/long-form", response_model=List[MemoryRead])
async def get_long_form_memories(
    channel_id: int,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    search_params = MemorySearch(
        channel_id=channel_id,
        category="LONG_FORM_MEMORY",
        limit=limit
    )
    return await memory_service.recall_memories(db, search_params)
