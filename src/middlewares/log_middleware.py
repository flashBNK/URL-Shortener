import structlog
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

log = structlog.get_logger("http")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()

        request_log = log.bind(
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host,
        )

        request_log.info("request started")

        response = await call_next(request)

        duration_ms = round((time.perf_counter() - start) * 1000, 2)

        request_log.info(
            "request finished",
            status_code=response.status_code,
            duration_ms=duration_ms,
        )

        return response