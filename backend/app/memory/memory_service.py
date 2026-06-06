from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime, timezone
from app.db.models import Memory
from app.memory.memory_models import MemoryCreate, MemorySearch
import json

class MemoryService:
    async def retain_memory(self, db: AsyncSession, memory_in: MemoryCreate) -> Memory:
        """
        Stores a new memory observation in Hindsight.
        """
        memory = Memory(
            channel_id=memory_in.channel_id,
            category=memory_in.category,
            content=memory_in.content,
            context_tags=memory_in.context_tags
        )
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        return memory

    async def recall_memories(self, db: AsyncSession, search_params: MemorySearch):
        """
        Retrieves relevant memories based on category and text search in tags/content.
        """
        query = select(Memory).filter(Memory.channel_id == search_params.channel_id)
        
        if search_params.category:
            query = query.filter(Memory.category == search_params.category)
            
        if search_params.query:
            # Basic textual match for MVP. Ideally this would be pgvector similarity search.
            search_term = f"%{search_params.query}%"
            query = query.filter(
                or_(
                    Memory.content.ilike(search_term),
                    # Postgres specific jsonb text search can be complex, fallback to string matching content
                )
            )
            
        query = query.order_by(Memory.created_at.desc()).limit(search_params.limit)
        result = await db.execute(query)
        memories = result.scalars().all()
        
        # Update recall stats
        for mem in memories:
            mem.recall_count += 1
            mem.last_recalled_at = datetime.now(timezone.utc)
            db.add(mem)
        await db.commit()
        
        return memories

    async def build_memory_context(self, db: AsyncSession, channel_id: int) -> str:
        """
        Builds a compiled string of all relevant memories for the LLM context window.
        """
        # Fetch top memories across categories
        audience_mems = await self.recall_memories(db, MemorySearch(channel_id=channel_id, category="Audience", limit=5))
        rec_mems = await self.recall_memories(db, MemorySearch(channel_id=channel_id, category="Recommendation", limit=5))
        trend_mems = await self.recall_memories(db, MemorySearch(channel_id=channel_id, category="Trend", limit=5))
        
        context = "--- HISTORICAL HINDSIGHT MEMORY ---\n"
        
        context += "AUDIENCE EVOLUTION:\n"
        for m in audience_mems:
            context += f"- {m.content}\n"
            
        context += "\nPAST RECOMMENDATION OUTCOMES:\n"
        for m in rec_mems:
            context += f"- {m.content}\n"
            
        context += "\nTREND OBSERVATIONS:\n"
        for m in trend_mems:
            context += f"- {m.content}\n"
            
        return context

    async def build_memory_context_by_category(self, db: AsyncSession, channel_id: int, category: str) -> str:
        """
        Builds a compiled string of all relevant memories for a specific memory category.
        """
        mems = await self.recall_memories(db, MemorySearch(channel_id=channel_id, category=category, limit=10))
        context = f"--- HISTORICAL {category} ---\n"
        for m in mems:
            context += f"- {m.content}\n"
        return context

memory_service = MemoryService()
