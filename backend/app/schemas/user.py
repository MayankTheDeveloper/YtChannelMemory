from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDBBase(UserBase):
    id: int
    created_at: datetime
    youtube_credentials: Optional[Dict[str, Any]] = None

    model_config = {"from_attributes": True}

class User(UserInDBBase):
    pass
