from fastapi import Request
from slowapi import Limiter


def get_rate_limit_key(request: Request) -> str:
    """
        Для авторизованных пользователей ключ = токен (уникален на юзера).
        Для анонимов ключ = IP-адрес.
        Префиксы 'user:' и 'ip:' нужны, чтобы исключить теоретическое
        совпадение токена с чьим-то IP.
    """
    auth_header = request.headers.get("authorization", "")

    if auth_header.startswith("Bearer "):
        token = auth_header.removeprefix("Bearer ").strip()
        if token:
            return f"user:{token}"

    return f"ip:{request.client.host}"


def get_anon_key(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer ") and auth_header[7:].strip():
        return None
    return f"ip:{request.client.host}"


def get_auth_key(request: Request) -> str | None:
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token:
            return f"user:{token}"
    return None


limiter = Limiter(
    key_func=get_rate_limit_key,
    storage_uri="memory://",
    key_prefix="ratelimit",
)
