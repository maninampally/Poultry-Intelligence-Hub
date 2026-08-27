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
