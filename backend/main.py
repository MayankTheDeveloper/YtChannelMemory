from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sentry_sdk
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from redis import asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
from fastapi_limiter import FastAPILimiter

load_dotenv()

# Initialize Sentry
sentry_dsn = os.getenv("SENTRY_DSN", "")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis = aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="fastapi-cache")
    await FastAPILimiter.init(redis)
    yield
    # Shutdown
    await redis.close()

app = FastAPI(
    title="YtChannelMemory API",
    description="AI-Powered Autonomous Content Creator Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1 import auth, channels, insights, competitors, trends, reports, creation, memory

@app.get("/")
def read_root():
    return {"message": "Welcome to YtChannelMemory API"}

from app.db.session import SessionLocal
from sqlalchemy import text
from app.worker.celery_app import celery_app

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Service is healthy"}

@app.get("/ready")
async def ready_check():
    health_status = {
        "status": "ok",
        "database": "unknown",
        "redis": "unknown",
        "celery": "unknown"
    }
    
    # Check DB
    try:
        async with SessionLocal() as db:
            await db.execute(text("SELECT 1"))
        health_status["database"] = "ok"
    except Exception as e:
        health_status["database"] = f"error: {str(e)}"
        health_status["status"] = "error"
        
    # Check Celery/Redis
    try:
        # Pinging celery app's broker
        with celery_app.connection() as conn:
            conn.default_channel.basic_qos(0, 1, False)
        health_status["redis"] = "ok"
        health_status["celery"] = "ok"
    except Exception as e:
        health_status["redis"] = f"error: {str(e)}"
        health_status["celery"] = f"error: {str(e)}"
        health_status["status"] = "error"
        
    return health_status

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(channels.router, prefix="/api/v1/channels", tags=["channels"])
app.include_router(insights.router, prefix="/api/v1/insights", tags=["insights"])
app.include_router(trends.router, prefix="/api/v1/trends", tags=["trends"])
app.include_router(competitors.router, prefix="/api/v1/competitors", tags=["competitors"])
app.include_router(creation.router, prefix="/api/v1/creation", tags=["creation"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])
app.include_router(memory.router, prefix="/api/v1/memory", tags=["memory"])
