"""Application services for mortality synchronization."""

import json
from datetime import datetime, timezone
from uuid import UUID

from psycopg.rows import dict_row

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.core.database import transaction

from .schemas import MortalitySyncOperation, SyncPushResult


def push_mortality(operation: MortalitySyncOperation, auth: AuthContext) -> SyncPushResult:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT operation_id, event_id, status
                FROM internal.sync_operations
                WHERE idempotency_key = %s AND tenant_id = %s
                """,
                (operation.idempotency_key, auth.tenant_id),
            )
            existing = cursor.fetchone()
            if existing:
                return SyncPushResult(
                    operation_id=existing["operation_id"],
                    accepted=existing["status"] == "accepted",
                    event_id=existing["event_id"],
                    duplicate=True,
                )

            cursor.execute(
                """
                INSERT INTO app.farm_events (
                  id, event_type, tenant_id, farm_id, shed_id, batch_id,
                  occurred_at, client_occurred_at, actor_user_id,
                  supersedes_event_id, payload
                )
                SELECT %s, 'mortality.logged', %s, b.farm_id, %s, %s,
                       %s, %s, %s, %s, %s
                FROM public.batches b
                JOIN public.farms f ON f.id = b.farm_id
                JOIN public.farm_memberships membership
                  ON membership.farm_id = f.id
                 AND membership.tenant_id = %s
                 AND membership.user_id = %s
                WHERE b.id = %s AND b.shed_id = %s
                RETURNING id
                """,
                (
                    operation.entity_id,
                    auth.tenant_id,
                    operation.shed_id,
                    operation.batch_id,
                    operation.occurred_at,
                    operation.occurred_at,
                    auth.user_id,
                    operation.supersedes_event_id,
                    json.dumps({
                        "batch_id": str(operation.batch_id),
                        "shed_id": str(operation.shed_id),
                        "count": operation.count,
                        "shift": operation.shift,
                        "cause": operation.cause,
                    }),
                    auth.tenant_id,
                    auth.user_id,
                    operation.batch_id,
                    operation.shed_id,
                ),
            )
            event = cursor.fetchone()
            if not event:
                raise ValueError("Batch and shed scope could not be validated")

            cursor.execute(
                """
                INSERT INTO app.mortality_events (event_id, batch_id, shed_id, count, shift, cause)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    event["id"],
                    operation.batch_id,
                    operation.shed_id,
                    operation.count,
                    operation.shift,
                    operation.cause,
                ),
            )
            cursor.execute(
                """
                INSERT INTO internal.sync_operations (
                  operation_id, idempotency_key, resource, action, entity_id,
                  tenant_id, actor_user_id, base_version, occurred_at, payload,
                  status, event_id, processed_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'accepted', %s, %s)
                """,
                (
                    operation.operation_id,
                    operation.idempotency_key,
                    operation.resource,
                    operation.action,
                    operation.entity_id,
                    auth.tenant_id,
                    auth.user_id,
                    operation.base_version,
                    operation.occurred_at,
                    json.dumps(operation.model_dump(mode="json")),
                    event["id"],
                    datetime.now(timezone.utc),
                ),
            )
            cursor.execute(
                """
                INSERT INTO internal.outbox_events (event_id, topic, payload)
                VALUES (%s, 'mortality.logged', %s)
                """,
                (event["id"], json.dumps({"event_id": str(event["id"]), "batch_id": str(operation.batch_id)})),
            )
            cursor.execute(
                """
                INSERT INTO internal.audit_log (
                  tenant_id, actor_user_id, action, resource, resource_id, event_id, metadata
                )
                VALUES (%s, %s, 'create', 'mortality-entry', %s, %s, %s)
                """,
                (auth.tenant_id, auth.user_id, operation.entity_id, event["id"], json.dumps({})),
            )
            return SyncPushResult(operation_id=operation.operation_id, accepted=True, event_id=event["id"])


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
