"""Idempotent mortality projection task."""

from datetime import datetime, timezone
from uuid import UUID

from psycopg.rows import dict_row

from murgi_mitra.core.database import transaction


def rebuild_batch_metrics(batch_id: UUID) -> None:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT b.placement_count, b.farm_id, f.tenant_id,
                       COALESCE(SUM((e.payload ->> 'count')::integer), 0) AS mortality,
                       MAX(e.id) AS last_event_id
                FROM public.batches b
                JOIN public.farms f ON f.id = b.farm_id
                LEFT JOIN app.farm_events e
                  ON e.batch_id = b.id
                 AND e.event_type = 'mortality.logged'
                 AND NOT EXISTS (
                   SELECT 1 FROM app.farm_events correction
                   WHERE correction.supersedes_event_id = e.id
                 )
                WHERE b.id = %s
                GROUP BY b.id, b.placement_count, b.farm_id, f.tenant_id
                """,
                (batch_id,),
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError("Batch not found")
            placement = row["placement_count"]
            mortality = int(row["mortality"])
            cursor.execute(
                """
                INSERT INTO app.batch_metrics (
                  batch_id, tenant_id, placement_count, cumulative_mortality, live_bird_count,
                  mortality_percent, last_processed_event_id, calculation_version,
                  projection_status, last_calculated_at
                )
                VALUES (%s, %s, %s, %s, GREATEST(%s - %s, 0), %s, %s, 1, 'current', %s)
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
                    row["tenant_id"],
                    placement,
                    mortality,
                    placement,
                    mortality,
                    mortality * 100 / placement,
                    row["last_event_id"],
                    datetime.now(timezone.utc),
                ),
            )
