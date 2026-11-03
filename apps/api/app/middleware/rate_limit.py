"""Simple in-process rate limit for non-local environments.

Not a substitute for an API gateway. Good enough to blunt abuse on a
single API instance; scale-out should terminate TLS/rate-limit at the edge.
"""

from __future__ import annotations

import time
from collections import defaultdict, deque
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(
        self,
        app,
        *,
        requests_per_minute: int = 120,
        enabled: bool = True,
        exempt_paths: frozenset[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.enabled = enabled
        self.exempt_paths = exempt_paths or frozenset(
            {"/health", "/health/live", "/health/ready", "/docs", "/openapi.json", "/redoc"}
        )
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if not self.enabled or request.url.path in self.exempt_paths:
            return await call_next(request)

        client = request.client.host if request.client else "unknown"
        now = time.monotonic()
        window = self._hits[client]
        while window and now - window[0] > 60.0:
            window.popleft()
        if len(window) >= self.requests_per_minute:
            return JSONResponse(
                {"detail": "rate limit exceeded"},
                status_code=429,
                headers={"Retry-After": "60"},
            )
        window.append(now)
        return await call_next(request)
