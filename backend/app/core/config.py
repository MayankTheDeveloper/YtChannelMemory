from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "YtChannelMemory API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Individual Postgres fields (local dev)
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "yt_memory_user"
    POSTGRES_PASSWORD: str = "yt_memory_password"
    POSTGRES_DB: str = "yt_memory_db"
    POSTGRES_PORT: str = "5434"
    
    # Full DATABASE_URL takes priority (Railway/Render provides this)
    DATABASE_URL: Optional[str] = None
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_URL:
            # Railway provides postgresql:// — convert to asyncpg driver
            url = self.DATABASE_URL
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            return url
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    REDIS_URL: str = "redis://localhost:6379/0"
    
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    YOUTUBE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    # Frontend URL for CORS in production (set to your Vercel URL)
    FRONTEND_URL: str = "*"
    
    model_config = SettingsConfigDict(env_file=".env", env_ignore_empty=True, extra="ignore")

settings = Settings()
