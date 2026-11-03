"""FastAPI application entrypoint for Poultry Intelligence Hub."""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.logging_config import configure_logging
from app.middleware.rate_limit import RateLimitMiddleware
from app.routers import (
    analytics,
    auth as auth_router,
    expenses,
    farms,
    flocks,
    health,
    lifting,
    records,
    settlements,
    sync,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: open the DB pool. Failure here should not crash import-time;
    # /health/ready reports DB status.
    try:
        await db.init_pool()
    except Exception:
        logger.exception("Database pool initialization failed")
    yield
    await db.close_pool()


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.environment)
    settings.validate_security()
    app = FastAPI(
        title="Poultry Intelligence Hub API",
        version="0.1.0",
        lifespan=lifespan,
    )
    # Last added = outermost. Rate limit wraps CORS wraps app.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(
        RateLimitMiddleware,
        requests_per_minute=settings.rate_limit_per_minute,
        enabled=(
            not settings.allows_unverified_jwt
            and settings.rate_limit_per_minute > 0
        ),
    )
    app.include_router(health.router)
    app.include_router(auth_router.router)
    app.include_router(farms.router)
    app.include_router(flocks.router)
    app.include_router(records.router)
    app.include_router(lifting.router)
    app.include_router(settlements.router)
    app.include_router(expenses.router)
    app.include_router(sync.router)
    app.include_router(analytics.router)
    return app


app = create_app()
