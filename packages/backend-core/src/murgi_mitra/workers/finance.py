"""Rebuildable batch financial projection."""

from uuid import UUID

from psycopg.rows import dict_row

from murgi_mitra.core.database import transaction


def rebuild_batch_financials(batch_id: UUID) -> None:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT
                  COALESCE((SELECT SUM(amount) FROM app.expense_events WHERE batch_id = %s), 0) AS expenses,
                  COALESCE((SELECT SUM(total_weight_kg * price_per_kg)
                            FROM app.sale_events WHERE batch_id = %s), 0) AS revenue,
                  (SELECT placement_count FROM public.batches WHERE id = %s) AS placement
                """,
                (batch_id, batch_id, batch_id),
            )
            row = cursor.fetchone()
            if not row or row["placement"] is None:
                raise ValueError("Batch not found")
            cursor.execute(
                """
                INSERT INTO app.batch_financial_summary
                  (batch_id, tenant_id, total_expense, total_revenue, margin, cost_per_bird)
                SELECT b.id, f.tenant_id, %s, %s, %s - %s, %s / NULLIF(%s, 0)
                FROM public.batches b
                JOIN public.farms f ON f.id = b.farm_id
                WHERE b.id = %s
                ON CONFLICT (batch_id) DO UPDATE SET
                  total_expense = EXCLUDED.total_expense,
                  total_revenue = EXCLUDED.total_revenue,
                  margin = EXCLUDED.margin,
                  cost_per_bird = EXCLUDED.cost_per_bird,
                  projection_status = 'current',
                  updated_at = CURRENT_TIMESTAMP
                """,
                (
                    row["expenses"], row["revenue"], row["revenue"], row["expenses"],
                    row["expenses"], row["placement"], batch_id,
                ),
            )
