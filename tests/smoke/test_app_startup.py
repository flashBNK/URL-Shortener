import pytest


@pytest.mark.asyncio
async def test_app_starts(client):
    response = await client.get("/openapi.json")

    assert response.status_code == 200
    assert "paths" in response.json()


@pytest.mark.asyncio
async def test_api_routes_exist(client):
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]

    assert "/api/v1/user" in paths or "/api/v1/auth" in paths or "/api/v1/link" in paths