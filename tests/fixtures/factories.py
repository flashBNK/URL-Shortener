from tests.fixtures.data import (
    VALID_USERNAME,
    VALID_EMAIL,
    VALID_PASSWORD,
    VALID_URL,
    VALID_SHORT_URL,
)


def make_user_payload(
    username: str = VALID_USERNAME,
    email: str = VALID_EMAIL,
    password: str = VALID_PASSWORD,
) -> dict:
    return {
        "username": username,
        "email": email,
        "password": password,
    }


def make_link_payload(
    url: str = VALID_URL,
    short_url: str = VALID_SHORT_URL,
) -> dict:
    return {
        "url": url,
        "short_url": short_url,
    }