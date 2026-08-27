"""Performance and finance event synchronization."""

import json
from datetime import datetime, timezone

from psycopg.rows import dict_row

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.core.database import transaction

from .schemas import ExpenseSyncOperation, SaleSyncOperation, SyncPushResult, WeightSyncOperation


def push_performance_or_finance(
    operation: WeightSyncOperation | ExpenseSyncOperation | SaleSyncOperation,
    auth: AuthContext,
) -> SyncPushResult:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT operation_id, event_id, status FROM internal.sync_operations "
                "WHERE idempotency_key = %s AND tenant_id = %s",
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

            farm_id = getattr(operation, "farm_id", None)
            if farm_id is None:
                cursor.execute("SELECT farm_id FROM public.batches WHERE id = %s", (operation.batch_id,))
                batch = cursor.fetchone()
                farm_id = batch["farm_id"] if batch else None
            if not farm_id:
                raise ValueError("Farm scope could not be validated")

            cursor.execute(
                """
                INSERT INTO app.farm_events
                  (id, event_type, tenant_id, farm_id, shed_id, batch_id,
                   occurred_at, client_occurred_at, actor_user_id, payload)
                SELECT %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                WHERE EXISTS (
                  SELECT 1 FROM public.farm_memberships
                  WHERE farm_id = %s AND tenant_id = %s AND user_id = %s
                )
                RETURNING id
                """,
                (
                    operation.entity_id,
                    f"{operation.resource}.logged",
                    auth.tenant_id,
                    farm_id,
                    getattr(operation, "shed_id", None),
                    getattr(operation, "batch_id", None),
                    operation.occurred_at,
                    operation.occurred_at,
                    auth.user_id,
                    json.dumps(operation.model_dump(mode="json")),
                    farm_id,
                    auth.tenant_id,
                    auth.user_id,
                ),
            )
            event = cursor.fetchone()
            if not event:
                raise ValueError("Farm scope could not be validated")

            if isinstance(operation, WeightSyncOperation):
                cursor.execute(
                    """
                    INSERT INTO app.weight_sample_events
                      (event_id, tenant_id, batch_id, shed_id, sample_size,
                       total_weight_kg, average_weight_kg)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (event["id"], auth.tenant_id, operation.batch_id, operation.shed_id,
                     operation.sample_size, operation.total_weight_kg, operation.average_weight_kg),
                )
            elif isinstance(operation, ExpenseSyncOperation):
                cursor.execute(
                    """
                    INSERT INTO app.expense_events
                      (event_id, tenant_id, farm_id, batch_id, category, amount, occurred_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (event["id"], auth.tenant_id, farm_id, operation.batch_id,
                     operation.category, operation.amount, operation.occurred_at),
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO app.sale_events
                      (event_id, tenant_id, farm_id, batch_id, birds_sold,
                       total_weight_kg, price_per_kg, buyer, occurred_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (event["id"], auth.tenant_id, farm_id, operation.batch_id,
                     operation.birds_sold, operation.total_weight_kg, operation.price_per_kg,
                     operation.buyer, operation.occurred_at),
                )
            cursor.execute(
                """
                INSERT INTO internal.sync_operations
                  (operation_id, idempotency_key, resource, action, entity_id,
                   tenant_id, actor_user_id, occurred_at, payload, status, event_id, processed_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'accepted', %s, %s)
                """,
                (operation.operation_id, operation.idempotency_key, operation.resource,
                 operation.action, operation.entity_id, auth.tenant_id, auth.user_id,
                 operation.occurred_at, json.dumps(operation.model_dump(mode="json")),
                 event["id"], datetime.now(timezone.utc)),
            )
            cursor.execute(
                "INSERT INTO internal.outbox_events (event_id, topic, payload) VALUES (%s, %s, %s)",
                (event["id"], f"{operation.resource}.logged", json.dumps({"event_id": str(event["id"])})),
            )
            cursor.execute(
                """
                INSERT INTO internal.audit_log
                  (tenant_id, actor_user_id, action, resource, resource_id, event_id)
                VALUES (%s, %s, 'create', %s, %s, %s)
                """,
                (auth.tenant_id, auth.user_id, operation.resource, operation.entity_id, event["id"]),
            )
            return SyncPushResult(operation_id=operation.operation_id, accepted=True, event_id=event["id"])
