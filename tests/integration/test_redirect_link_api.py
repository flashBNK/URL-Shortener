import pytest
from unittest.mock import AsyncMock, patch
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
from redis.exceptions import ConnectionError as RedisConnectionError

from infrastructure.databases.postgresql.models.link import Link


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
async def test_redirect_link_falls_back_to_database_when_cache_get_fails(client, session):
    link = Link(
        short_url="redisget",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )
    session.add(link)
    await session.flush()

    with (
        patch("services.geo.GeoService.get_country", new=AsyncMock(return_value="Russia")),
        patch(
            "infrastructure.redis.link_cache.LinkCache.get",
            new=AsyncMock(side_effect=RedisConnectionError("redis unavailable")),
        ),
        patch("infrastructure.redis.link_cache.LinkCache.set", new=AsyncMock()),
    ):
        response = await client.get("/redisget", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"

    result = await session.execute(select(Link).where(Link.short_url == "redisget"))
    db_link = result.scalar_one()

    assert db_link.total == 1


@pytest.mark.asyncio
async def test_redirect_link_ignores_cache_set_failure_after_database_lookup(client, session):
    link = Link(
        short_url="redisset",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )
    session.add(link)
    await session.flush()

    with (
        patch("services.geo.GeoService.get_country", new=AsyncMock(return_value="Russia")),
        patch("infrastructure.redis.link_cache.LinkCache.get", new=AsyncMock(return_value=None)),
        patch(
            "infrastructure.redis.link_cache.LinkCache.set",
            new=AsyncMock(side_effect=RedisConnectionError("redis unavailable")),
        ),
    ):
        response = await client.get("/redisset", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"

    result = await session.execute(select(Link).where(Link.short_url == "redisset"))
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
async def test_redirect_link_cache_hit(client, session):

    link = Link(
        short_url="cache123",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )

    session.add(link)
    await session.flush()

    cached_link = dict(
        id=link.id,
        url=link.url,
        short_url=link.short_url,
        total=link.total,
        is_active=link.is_active,
        expires_at=link.expires_at,
        user_id=link.user_id,
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
            "/cache123",
            follow_redirects=False,
        )

    assert response.status_code == 307
    assert response.headers["location"] == "https://example.com"


@pytest.mark.asyncio
async def test_redirect_link_expired(client, session):
    link = Link(
        short_url="expired123",
        url="https://example.com",
        total=0,
        is_active=True,
        expires_at=datetime.now(timezone.utc) - timedelta(days=1),
        user_id=None,
    )
    session.add(link)
    await session.commit()

    with (
        patch("services.geo.GeoService.get_country", new=AsyncMock(return_value="Russia")),
        patch("infrastructure.redis.link_cache.LinkCache.get", new=AsyncMock(return_value=None)),
        patch("infrastructure.redis.link_cache.LinkCache.set", new=AsyncMock()),
    ):
        response = await client.get("/expired123", follow_redirects=False)

    assert response.status_code == 403
    assert response.status_code != 307


@pytest.mark.asyncio
async def test_redirect_link_inactive(client, session):
    link = Link(
        short_url="inactive123",
        url="https://example.com",
        total=0,
        is_active=False,
        expires_at=None,
        user_id=None,
    )
    session.add(link)
    await session.commit()

    with (
        patch("services.geo.GeoService.get_country", new=AsyncMock(return_value="Russia")),
        patch("infrastructure.redis.link_cache.LinkCache.get", new=AsyncMock(return_value=None)),
        patch("infrastructure.redis.link_cache.LinkCache.set", new=AsyncMock()),
    ):
        response = await client.get("/inactive123", follow_redirects=False)

    assert response.status_code == 403
    assert response.status_code != 307