"""Runtime configuration for the shared backend."""

import os


def database_url() -> str:
    value = os.getenv("DATABASE_URL")
    if not value:
        raise RuntimeError("DATABASE_URL must be set")
    return value


def jwt_secret() -> str:
    value = os.getenv("JWT_SECRET")
    if not value:
        raise RuntimeError("JWT_SECRET must be set")
    return value


def supabase_url() -> str:
    value = os.getenv("SUPABASE_URL") or os.getenv("PUBLIC_SUPABASE_URL")
    if not value:
        raise RuntimeError("SUPABASE_URL must be set")
    return value.rstrip("/")
