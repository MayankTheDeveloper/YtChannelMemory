from app.langgraph.state import ChannelAnalysisState
from app.db.session import SessionLocal
from app.memory.memory_service import memory_service
from app.memory.memory_models import MemoryCreate

async def memory_recall_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retrieves historical context from Hindsight before recommendations are generated.
    """
    channel_id = state.get("channel_id")
    
    async with SessionLocal() as db:
        context_str = await memory_service.build_memory_context(db, channel_id)
        state["memory_context"] = context_str
        
    return state

async def memory_retain_node(state: ChannelAnalysisState) -> ChannelAnalysisState:
    """
    Retains the recommendations generated as memories for the future.
    """
    channel_id = state.get("channel_id")
    recommendations = state.get("recommendations", [])
    
    retained = []
    
    async with SessionLocal() as db:
        for rec in recommendations:
            # Create a memory of this recommendation being generated
            mem_content = f"Generated recommendation: '{rec.get('title')}' due to strong audience match ({rec.get('audience_score')}) and trend velocity ({rec.get('trend_score')})."
            
            mem_in = MemoryCreate(
                channel_id=channel_id,
                category="Recommendation",
                content=mem_content,
                context_tags=rec.get("related_trends", [])
            )
            
            await memory_service.retain_memory(db, mem_in)
            retained.append(mem_content)
            
    state["retained_memories"] = [{"content": m} for m in retained]
    return state
