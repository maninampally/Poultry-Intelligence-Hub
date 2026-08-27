"""Feed movement synchronization service."""

import json
from datetime import datetime, timezone

from psycopg.rows import dict_row

from murgi_mitra.core.auth import AuthContext
from murgi_mitra.core.database import transaction

from .schemas import FeedSyncOperation, SyncPushResult


def push_feed_movement(operation: FeedSyncOperation, auth: AuthContext) -> SyncPushResult:
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

            cursor.execute(
                """
                INSERT INTO app.farm_events (
                  id, event_type, tenant_id, farm_id, shed_id, batch_id,
                  occurred_at, client_occurred_at, actor_user_id, payload
                )
                SELECT %s, 'feed.inventory.moved', %s, %s, %s, %s,
                       %s, %s, %s, %s
                WHERE EXISTS (
                  SELECT 1 FROM public.farm_memberships
                  WHERE farm_id = %s AND tenant_id = %s AND user_id = %s
                )
                RETURNING id
                """,
                (
                    operation.entity_id,
                    auth.tenant_id,
                    operation.farm_id,
                    operation.shed_id,
                    operation.batch_id,
                    operation.occurred_at,
                    operation.occurred_at,
                    auth.user_id,
                    json.dumps(operation.model_dump(mode="json")),
                    operation.farm_id,
                    auth.tenant_id,
                    auth.user_id,
                ),
            )
            event = cursor.fetchone()
            if not event:
                raise ValueError("Farm scope could not be validated")
            cursor.execute(
                """
                INSERT INTO app.feed_inventory_movements (
                  event_id, tenant_id, farm_id, product_id, lot_id,
                  movement_type, quantity_kg, batch_id, shed_id
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    event["id"], auth.tenant_id, operation.farm_id, operation.product_id,
                    operation.lot_id, operation.movement_type, operation.quantity_kg,
                    operation.batch_id, operation.shed_id,
                ),
            )
            cursor.execute(
                """
                INSERT INTO internal.sync_operations (
                  operation_id, idempotency_key, resource, action, entity_id,
                  tenant_id, actor_user_id, occurred_at, payload, status,
                  event_id, processed_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'accepted', %s, %s)
                """,
                (
                    operation.operation_id, operation.idempotency_key, operation.resource,
                    operation.action, operation.entity_id, auth.tenant_id, auth.user_id,
                    operation.occurred_at, json.dumps(operation.model_dump(mode="json")),
                    event["id"], datetime.now(timezone.utc),
                ),
            )
            cursor.execute(
                "INSERT INTO internal.outbox_events (event_id, topic, payload) VALUES (%s, %s, %s)",
                (event["id"], "feed.inventory.moved", json.dumps({"event_id": str(event["id"])})),
            )
            cursor.execute(
                """
                INSERT INTO internal.audit_log
                  (tenant_id, actor_user_id, action, resource, resource_id, event_id)
                VALUES (%s, %s, 'create', 'feed-movement', %s, %s)
                """,
                (auth.tenant_id, auth.user_id, operation.entity_id, event["id"]),
            )
            return SyncPushResult(operation_id=operation.operation_id, accepted=True, event_id=event["id"])
