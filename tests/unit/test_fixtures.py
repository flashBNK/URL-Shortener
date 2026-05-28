from tests.fixtures.factories import make_user_payload, make_link_payload


def test_make_user_payload():
    payload = make_user_payload()

    assert payload["username"] == "testuser"
    assert "@" in payload["email"]


def test_make_link_payload():
    payload = make_link_payload()

    assert payload["url"].startswith("https://")
    assert payload["short_url"]