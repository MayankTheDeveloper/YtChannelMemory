from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings

from sqlalchemy.pool import NullPool

engine = create_async_engine(settings.SQLALCHEMY_DATABASE_URI, poolclass=NullPool, echo=True, future=True)

SessionLocal = async_sessionmaker(bind=engine, autocommit=False, autoflush=False, expire_on_commit=False, class_=AsyncSession)

async def get_db():
    async with SessionLocal() as session:
        yield session
