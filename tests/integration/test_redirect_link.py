import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select

from infrastructure.databases.postgresql.models.link import Link
from domain.link.models import LinkDTO


@pytest.mark.asyncio
async def test_redirect_link_cache_miss(client, session):
    link = Link(
        short_url="abc123",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )
    session.add(link)
    await session.flush()
    await session.commit()

    with (
        patch("services.geo.GeoService.get_country", new=AsyncMock(return_value="Russia")),
        patch("infrastructure.redis.link_cache.LinkCache.get", new=AsyncMock(return_value=None)),
        patch("infrastructure.redis.link_cache.LinkCache.set", new=AsyncMock()),
    ):
        response = await client.get("/abc123", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"

    result = await session.execute(select(Link).where(Link.short_url == "abc123"))
    db_link = result.scalar_one()

    assert db_link.total == 1


@pytest.mark.asyncio
async def test_redirect_link_not_found(client):

    with (
        patch(
            "services.geo.GeoService.get_country",
            new=AsyncMock(return_value="Russia"),
        ),
        patch(
            "infrastructure.redis.link_cache.LinkCache.get",
            new=AsyncMock(return_value=None),
        ),
    ):

        response = await client.get(
            "/unknown123",
            follow_redirects=False,
        )

    assert response.status_code == 404




@pytest.mark.asyncio
async def test_redirect_link_cache_hit(client):

    cached_link = dict(
        id=1,
        url="https://example.com",
        short_url="abc123",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )

    with (
        patch(
            "services.geo.GeoService.get_country",
            new=AsyncMock(return_value="Russia"),
        ),
        patch(
            "infrastructure.redis.link_cache.LinkCache.get",
            new=AsyncMock(return_value=cached_link),
        ),
    ):

        response = await client.get(
            "/abc123",
            follow_redirects=False,
        )

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"