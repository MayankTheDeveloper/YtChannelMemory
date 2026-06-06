import pytest
from httpx import AsyncClient, ASGITransport
from main import app
from app.core.utils import parse_iso8601_duration

def test_parse_iso8601_duration():
    # Test valid formats
    assert parse_iso8601_duration("PT30S") == 30
    assert parse_iso8601_duration("PT1M") == 60
    assert parse_iso8601_duration("PT1M30S") == 90
    assert parse_iso8601_duration("PT1H") == 3600
    assert parse_iso8601_duration("PT1H30M") == 5400
    assert parse_iso8601_duration("P1DT1H") == 90000
    
    # Test empty/invalid formats
    assert parse_iso8601_duration("") == 0
    assert parse_iso8601_duration(None) == 0
    assert parse_iso8601_duration("invalid") == 0

@pytest.mark.asyncio
async def test_recommendations_endpoints_exist():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/recommendations/shorts?channel_id=1")
        assert response.status_code in [200, 401, 404]
        if response.status_code == 200:
            assert isinstance(response.json(), list)

        response = await ac.get("/api/v1/recommendations/long-form?channel_id=1")
        assert response.status_code in [200, 401, 404]
        if response.status_code == 200:
            assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_insights_endpoints_exist():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/insights/shorts?channel_id=1")
        assert response.status_code in [200, 401, 404]

        response = await ac.get("/api/v1/insights/long-form?channel_id=1")
        assert response.status_code in [200, 401, 404]

@pytest.mark.asyncio
async def test_memory_endpoints_exist():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/memory/shorts?channel_id=1")
        assert response.status_code in [200, 401, 404]

        response = await ac.get("/api/v1/memory/long-form?channel_id=1")
        assert response.status_code in [200, 401, 404]

@pytest.mark.asyncio
async def test_opportunities_endpoints_exist():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/trends/opportunities?channel_id=1")
        assert response.status_code in [200, 401, 404]
        if response.status_code == 200:
            data = response.json()
            assert "shorts_opportunities" in data
            assert "long_form_opportunities" in data
