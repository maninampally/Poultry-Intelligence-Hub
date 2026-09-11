"""Database transaction helper."""

from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row

from .config import database_url


@contextmanager
def transaction() -> Iterator[psycopg.Connection]:
    with psycopg.connect(database_url()) as connection:
        with connection.transaction():
            yield connection


def apply_rls_context(
    connection: psycopg.Connection,
    *,
    user_id: str,
    tenant_id: str,
) -> None:
    """Set local JWT claim GUCs so Postgres RLS (`auth.uid()`) can see the actor.

    FastAPI usually connects as a privileged role; this still documents the
    intended double-enforcement path and works when the DB role honors RLS.
    """
    claims = f'{{"sub":"{user_id}","role":"authenticated","tenant_id":"{tenant_id}"}}'
    connection.execute("SELECT set_config('request.jwt.claim.sub', %s, true)", (user_id,))
    connection.execute("SELECT set_config('request.jwt.claim.role', %s, true)", ("authenticated",))
    connection.execute("SELECT set_config('request.jwt.claims', %s, true)", (claims,))
    connection.execute("SELECT set_config('app.current_tenant_id', %s, true)", (str(tenant_id),))


def tenant_for_user(user_id: str) -> str | None:
    with psycopg.connect(database_url(), row_factory=dict_row) as connection:
        row = connection.execute(
            """
            SELECT tenant_id
            FROM public.tenant_memberships
            WHERE user_id = %s
            ORDER BY created_at
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()
        return str(row["tenant_id"]) if row else None
