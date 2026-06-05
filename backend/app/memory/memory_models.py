from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class MemoryCreate(BaseModel):
    channel_id: int
    category: str
    content: str
    context_tags: List[str] = []

class MemoryRead(MemoryCreate):
    id: int
    created_at: datetime
    last_recalled_at: Optional[datetime] = None
    recall_count: int

    model_config = ConfigDict(from_attributes=True)

class MemorySearch(BaseModel):
    channel_id: int
    category: Optional[str] = None
    query: Optional[str] = None
    limit: int = 10
