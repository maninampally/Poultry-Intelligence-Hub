"""Liveness vs readiness (Phase 4).

- GET /health/live  — process is up (no dependency checks)
- GET /health/ready — DB pool answers (orchestrators use this)
- GET /health       — same as ready (back-compat)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Response

from app import db

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/health/live")
async def liveness() -> dict:
    return {"status": "ok"}


async def _db_up() -> bool:
    try:
        pool = db.get_pool()
        async with pool.acquire() as conn:
            await conn.execute("select 1")
        return True
    except Exception:
        logger.exception("Database readiness check failed")
        return False


@router.get("/health/ready")
async def readiness(response: Response) -> dict:
    db_ok = await _db_up()
    if not db_ok:
        response.status_code = 503
        return {"status": "not_ready", "database": "down"}
    return {"status": "ok", "database": "up"}


@router.get("/health")
async def health(response: Response) -> dict:
    """Back-compat alias of readiness."""
    return await readiness(response)
