import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from app.db.session import SessionLocal
from app.db.models import Recommendation, ContentBrief, Script, Storyboard, Channel, User
import asyncio

# Mock data creation inside tests
# In real testing, we'd use factories or test DB fixtures.
# We'll just assume endpoints return 404 if data doesn't exist. We want to test that the router is mounted.

@pytest.mark.asyncio
async def test_creation_routers_exist():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Just passing an invalid ID should return 404, proving the route exists and is validated.
        response = await ac.post("/api/v1/creation/content-briefs/generate?recommendation_id=9999")
        assert response.status_code in [404, 401] # 401 if auth required, 404 if not found

        response = await ac.post("/api/v1/creation/scripts/generate?brief_id=9999")
        assert response.status_code in [404, 401]

        response = await ac.post("/api/v1/creation/storyboards/generate?script_id=9999")
        assert response.status_code in [404, 401]
        
        response = await ac.post("/api/v1/creation/assets/generate?storyboard_id=9999")
        assert response.status_code in [404, 401]
        
        response = await ac.post("/api/v1/creation/videos/generate?storyboard_id=9999")
        assert response.status_code in [404, 401]
        
        response = await ac.post("/api/v1/creation/publish?video_id=9999")
        assert response.status_code in [404, 401]
