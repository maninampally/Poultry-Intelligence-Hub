"""Health check (no auth)."""

import logging

from fastapi import APIRouter

from app import db

router = APIRouter(tags=["health"])
logger = logging.getLogger(__name__)


@router.get("/health")
async def health() -> dict:
    db_ok = False
    try:
        pool = db.get_pool()
        async with pool.acquire() as conn:
            await conn.execute("select 1")
        db_ok = True
    except Exception:
        logger.exception("Database health check failed")
        db_ok = False
    return {"status": "ok", "database": "up" if db_ok else "down"}
