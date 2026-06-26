"""Tests for the burnout calculation endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.anyio
async def test_health_check(client):
    response = await client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.anyio
async def test_calculate_burnout_high_risk(client):
    payload = {
        "weekly_hours": 55,
        "consecutive_shifts": 6,
        "night_shifts": 4,
        "rest_hours": 5,
    }
    response = await client.post("/calculate-burnout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] >= 51
    assert data["risk_level"] in ("HIGH", "CRITICAL")
    assert "factors" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0


@pytest.mark.anyio
async def test_calculate_burnout_low_risk(client):
    payload = {
        "weekly_hours": 30,
        "consecutive_shifts": 2,
        "night_shifts": 1,
        "rest_hours": 10,
    }
    response = await client.post("/calculate-burnout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 0
    assert data["risk_level"] == "LOW"


@pytest.mark.anyio
async def test_calculate_burnout_critical(client):
    payload = {
        "weekly_hours": 65,
        "consecutive_shifts": 8,
        "night_shifts": 6,
        "rest_hours": 4,
    }
    response = await client.post("/calculate-burnout", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100
    assert data["risk_level"] == "CRITICAL"


@pytest.mark.anyio
async def test_score_clamped_at_100(client):
    payload = {
        "weekly_hours": 100,
        "consecutive_shifts": 14,
        "night_shifts": 10,
        "rest_hours": 1,
    }
    response = await client.post("/calculate-burnout", json=payload)
    assert response.status_code == 200
    assert response.json()["score"] <= 100


@pytest.mark.anyio
async def test_invalid_input_returns_422(client):
    payload = {"weekly_hours": "not-a-number", "consecutive_shifts": -1}
    response = await client.post("/calculate-burnout", json=payload)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_missing_fields_returns_422(client):
    response = await client.post("/calculate-burnout", json={})
    assert response.status_code == 422


@pytest.mark.anyio
async def test_factors_breakdown_present(client):
    payload = {
        "weekly_hours": 55,
        "consecutive_shifts": 6,
        "night_shifts": 4,
        "rest_hours": 7,
    }
    response = await client.post("/calculate-burnout", json=payload)
    data = response.json()
    factors = data["factors"]
    assert "weekly_hours" in factors
    assert "consecutive_shifts" in factors
    assert "night_shifts" in factors
    assert "rest_hours" in factors
    assert factors["weekly_hours"] == 20
    assert factors["consecutive_shifts"] == 20
    assert factors["night_shifts"] == 15
    assert factors["rest_hours"] == 25
