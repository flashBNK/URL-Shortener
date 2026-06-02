import pytest

from sqlalchemy import delete
from infrastructure.databases.postgresql.models.link import Link


@pytest.mark.asyncio
async def test_list_public_links_success(client, session):
    await session.execute(delete(Link))
    await session.commit()

    link1 = Link(
        short_url="pub001",
        url="https://example.com/1",
        total=0,
        is_active=True,
        expires_at=None,
        user_id=None,
    )
    link2 = Link(
        short_url="pub002",
        url="https://example.com/2",
        total=3,
        is_active=True,
        expires_at=None,
        user_id=None,
    )

    session.add_all([link1, link2])
    await session.flush()
    await session.commit()

    response = await client.get("public")

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2

    short_urls = {item["short_url"] for item in data["items"]}
    assert short_urls == {"pub001", "pub002"}