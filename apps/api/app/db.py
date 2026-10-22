"""Async Postgres access via asyncpg, with RLS user context.

Every request runs its queries inside a transaction where we set
`app.current_user_id` to the authenticated user's id. The database RLS
policies (and the auth.uid() stub / Supabase auth.uid()) read this to
enforce tenant isolation. The app's DB role must NOT have BYPASSRLS.
"""

from __future__ import annotations

import contextlib
from typing import AsyncIterator, Optional

import asyncpg

from app.config import get_settings

_pool: Optional[asyncpg.Pool] = None


async def init_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        settings = get_settings()
        _pool = await asyncpg.create_pool(
            dsn=settings.database_url,
            min_size=settings.db_pool_min,
            max_size=settings.db_pool_max,
        )
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("DB pool not initialized; call init_pool() on startup")
    return _pool


@contextlib.asynccontextmanager
async def acquire(user_id: Optional[str] = None) -> AsyncIterator[asyncpg.Connection]:
    """Acquire a connection in a transaction with the RLS user set.

    Usage:
        async with acquire(user_id) as conn:
            await conn.fetch("select ...")
    """
    pool = get_pool()
    async with pool.acquire() as conn:
        async with conn.transaction():
            # set_config(..., is_local=true) scopes to this transaction only.
            await conn.execute(
                "select set_config('app.current_user_id', $1, true)",
                user_id or "",
            )
            yield conn
