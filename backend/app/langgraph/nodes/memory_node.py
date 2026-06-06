from app.langgraph.state import ChannelAnalysisState
from app.db.session import SessionLocal
from app.memory.memory_service import memory_service
from app.memory.memory_models import MemoryCreate

async def shorts_memory_recall_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retrieves historical context from Hindsight for Shorts before recommendations are generated.
    """
    channel_id = state.get("channel_id")
    async with SessionLocal() as db:
        context_str = await memory_service.build_memory_context_by_category(db, channel_id, "SHORTS_MEMORY")
        state["shorts_memory_context"] = context_str
    return state

async def long_form_memory_recall_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retrieves historical context from Hindsight for Long-Form before recommendations are generated.
    """
    channel_id = state.get("channel_id")
    async with SessionLocal() as db:
        context_str = await memory_service.build_memory_context_by_category(db, channel_id, "LONG_FORM_MEMORY")
        state["long_form_memory_context"] = context_str
    return state

async def shorts_memory_retain_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retains the Shorts recommendations generated as memories for the future.
    """
    channel_id = state.get("channel_id")
    recommendations = state.get("shorts_recommendations", [])
    retained = []
    
    async with SessionLocal() as db:
        for rec in recommendations:
            mem_content = f"Generated Shorts recommendation: '{rec.get('title')}' due to reach and engagement match."
            mem_in = MemoryCreate(
                channel_id=channel_id,
                category="SHORTS_MEMORY",
                content=mem_content,
                context_tags=rec.get("related_trends", [])
            )
            await memory_service.retain_memory(db, mem_in)
            retained.append(mem_content)
            
    # Combine or append to retained_memories
    if "retained_memories" not in state:
        state["retained_memories"] = []
    state["retained_memories"].extend([{"content": m} for m in retained])
    return state

async def long_form_memory_retain_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retains the Long-Form recommendations generated as memories for the future.
    """
    channel_id = state.get("channel_id")
    recommendations = state.get("long_form_recommendations", [])
    retained = []
    
    async with SessionLocal() as db:
        for rec in recommendations:
            mem_content = f"Generated Long-Form recommendation: '{rec.get('title')}' optimized for watch time and subscriber growth."
            mem_in = MemoryCreate(
                channel_id=channel_id,
                category="LONG_FORM_MEMORY",
                content=mem_content,
                context_tags=rec.get("related_trends", [])
            )
            await memory_service.retain_memory(db, mem_in)
            retained.append(mem_content)
            
    if "retained_memories" not in state:
        state["retained_memories"] = []
    state["retained_memories"].extend([{"content": m} for m in retained])
    return state
