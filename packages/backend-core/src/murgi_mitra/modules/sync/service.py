"""Sync pull and frozen non-mortality push helpers.

Mortality writes go through modules.daily_ops (modular boundary).
Feed / weight / finance handlers remain here but are frozen until the
mortality MVP gate passes.
"""

from psycopg.rows import dict_row

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.core.database import transaction

# Re-export mortality adapter so existing imports keep working during transition.
from murgi_mitra.modules.daily_ops.infrastructure.sync_handler import push_mortality

__all__ = ["push_mortality", "pull_events"]


def pull_events(cursor_value: str | None, auth: AuthContext) -> tuple[list[dict], str | None]:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as db_cursor:
            db_cursor.execute(
                """
                SELECT id AS event_id, event_type, batch_id, occurred_at, created_at, payload
                FROM app.farm_events
                WHERE tenant_id = %s
                  AND (%s IS NULL OR created_at > %s::timestamptz)
                ORDER BY created_at, id
                LIMIT 100
                """,
                (auth.tenant_id, cursor_value, cursor_value),
            )
            rows = db_cursor.fetchall()
            next_cursor = rows[-1]["created_at"].isoformat() if rows else cursor_value
            return rows, next_cursor
