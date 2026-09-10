"""Mortality persistence and transactional outbox writes."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from psycopg import Connection
from psycopg.rows import dict_row

from murgi_mitra.modules.daily_ops.application.commands import LogMortality
from murgi_mitra.modules.daily_ops.domain.events import (
    EVENT_TYPE_MORTALITY_LOGGED,
    OUTBOX_TOPIC_MORTALITY_LOGGED,
    RESOURCE_MORTALITY_ENTRY,
    MortalityLogged,
)


class MortalityRepository:
    def __init__(self, connection: Connection) -> None:
        self._connection = connection

    def find_sync_operation(
        self, idempotency_key: str, tenant_id: str
    ) -> dict[str, Any] | None:
        with self._connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT operation_id, event_id, status
                FROM internal.sync_operations
                WHERE idempotency_key = %s AND tenant_id = %s
                """,
                (idempotency_key, tenant_id),
            )
            return cursor.fetchone()

    def insert_logged_event(self, command: LogMortality) -> MortalityLogged:
        with self._connection.cursor(row_factory=dict_row) as cursor:
            event = MortalityLogged(
                event_id=command.entity_id,
                batch_id=command.batch_id,
                shed_id=command.shed_id,
                count=command.count,
                shift=command.shift,
                cause=command.cause,
                occurred_at=command.occurred_at,
                supersedes_event_id=command.supersedes_event_id,
            )
            cursor.execute(
                """
                INSERT INTO app.farm_events (
                  id, event_type, tenant_id, farm_id, shed_id, batch_id,
                  occurred_at, client_occurred_at, actor_user_id,
                  supersedes_event_id, payload
                )
                SELECT %s, %s, %s, b.farm_id, %s, %s,
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
                    event.event_id,
                    EVENT_TYPE_MORTALITY_LOGGED,
                    command.tenant_id,
                    event.shed_id,
                    event.batch_id,
                    event.occurred_at,
                    event.occurred_at,
                    command.actor_user_id,
                    event.supersedes_event_id,
                    json.dumps(event.payload()),
                    command.tenant_id,
                    command.actor_user_id,
                    event.batch_id,
                    event.shed_id,
                ),
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError("Batch and shed scope could not be validated")

            cursor.execute(
                """
                INSERT INTO app.mortality_events (event_id, batch_id, shed_id, count, shift, cause)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    event.event_id,
                    event.batch_id,
                    event.shed_id,
                    event.count,
                    event.shift,
                    event.cause,
                ),
            )
            return event

    def record_accepted_sync(
        self,
        command: LogMortality,
        event: MortalityLogged,
        operation_payload: dict[str, Any],
    ) -> None:
        now = datetime.now(timezone.utc)
        with self._connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO internal.sync_operations (
                  operation_id, idempotency_key, resource, action, entity_id,
                  tenant_id, actor_user_id, base_version, occurred_at, payload,
                  status, event_id, processed_at
                )
                VALUES (%s, %s, %s, 'create', %s, %s, %s, %s, %s, %s, 'accepted', %s, %s)
                """,
                (
                    command.operation_id,
                    command.idempotency_key,
                    RESOURCE_MORTALITY_ENTRY,
                    command.entity_id,
                    command.tenant_id,
                    command.actor_user_id,
                    command.base_version,
                    command.occurred_at,
                    json.dumps(operation_payload),
                    event.event_id,
                    now,
                ),
            )
            cursor.execute(
                """
                INSERT INTO internal.outbox_events (event_id, topic, payload)
                VALUES (%s, %s, %s)
                """,
                (
                    event.event_id,
                    OUTBOX_TOPIC_MORTALITY_LOGGED,
                    json.dumps(
                        {
                            "event_id": str(event.event_id),
                            "batch_id": str(event.batch_id),
                        }
                    ),
                ),
            )
            cursor.execute(
                """
                INSERT INTO internal.audit_log (
                  tenant_id, actor_user_id, action, resource, resource_id, event_id, metadata
                )
                VALUES (%s, %s, 'create', %s, %s, %s, %s)
                """,
                (
                    command.tenant_id,
                    command.actor_user_id,
                    RESOURCE_MORTALITY_ENTRY,
                    command.entity_id,
                    event.event_id,
                    json.dumps({}),
                ),
            )

    def load_batch_mortality_totals(self, batch_id: UUID) -> dict[str, Any] | None:
        with self._connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT b.placement_count, b.farm_id, f.tenant_id,
                       COALESCE(SUM((e.payload ->> 'count')::integer), 0) AS mortality,
                       MAX(e.id) AS last_event_id
                FROM public.batches b
                JOIN public.farms f ON f.id = b.farm_id
                LEFT JOIN app.farm_events e
                  ON e.batch_id = b.id
                 AND e.event_type = %s
                 AND NOT EXISTS (
                   SELECT 1 FROM app.farm_events correction
                   WHERE correction.supersedes_event_id = e.id
                 )
                WHERE b.id = %s
                GROUP BY b.id, b.placement_count, b.farm_id, f.tenant_id
                """,
                (EVENT_TYPE_MORTALITY_LOGGED, batch_id),
            )
            return cursor.fetchone()

    def upsert_batch_metrics(
        self,
        *,
        batch_id: UUID,
        tenant_id: str,
        placement_count: int,
        cumulative_mortality: int,
        live_birds: int,
        mortality_pct: float,
        last_event_id: UUID | None,
    ) -> None:
        with self._connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO app.batch_metrics (
                  batch_id, tenant_id, placement_count, cumulative_mortality, live_bird_count,
                  mortality_percent, last_processed_event_id, calculation_version,
                  projection_status, last_calculated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, 1, 'current', %s)
                ON CONFLICT (batch_id) DO UPDATE SET
                  placement_count = EXCLUDED.placement_count,
                  cumulative_mortality = EXCLUDED.cumulative_mortality,
                  live_bird_count = EXCLUDED.live_bird_count,
                  mortality_percent = EXCLUDED.mortality_percent,
                  last_processed_event_id = EXCLUDED.last_processed_event_id,
                  calculation_version = EXCLUDED.calculation_version,
                  projection_status = EXCLUDED.projection_status,
                  last_calculated_at = EXCLUDED.last_calculated_at,
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    batch_id,
                    tenant_id,
                    placement_count,
                    cumulative_mortality,
                    live_birds,
                    mortality_pct,
                    last_event_id,
                    datetime.now(timezone.utc),
                ),
            )
