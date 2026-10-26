"""FastAPI application entrypoint for Poultry Intelligence Hub."""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import db
from app.config import get_settings
from app.routers import (
    analytics,
    auth as auth_router,
    farms,
    flocks,
    health,
    lifting,
    records,
    sync,
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: open the DB pool. Failure here should not crash import-time;
    # /health reports DB status.
    try:
        await db.init_pool()
    except Exception:
        logger.exception("Database pool initialization failed")
    yield
    await db.close_pool()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Poultry Intelligence Hub API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(health.router)
    app.include_router(auth_router.router)
    app.include_router(farms.router)
    app.include_router(flocks.router)
    app.include_router(records.router)
    app.include_router(lifting.router)
    app.include_router(sync.router)
    app.include_router(analytics.router)
    return app


app = create_app()
