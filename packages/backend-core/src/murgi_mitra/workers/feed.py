"""Rebuildable feed stock projection."""

from uuid import UUID

from psycopg.rows import dict_row

from murgi_mitra.core.database import transaction


def rebuild_feed_stock(tenant_id: UUID, farm_id: UUID, product_id: UUID) -> None:
    with transaction() as connection:
        with connection.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                SELECT COALESCE(SUM(
                  CASE WHEN movement_type = 'receipt' THEN quantity_kg
                       ELSE -quantity_kg END
                ), 0) AS stock, MAX(event_id) AS last_event_id
                FROM app.feed_inventory_movements
                WHERE tenant_id = %s AND farm_id = %s AND product_id = %s
                """,
                (tenant_id, farm_id, product_id),
            )
            row = cursor.fetchone()
            cursor.execute(
                """
                INSERT INTO app.feed_stock_snapshot
                  (tenant_id, farm_id, product_id, stock_kg, last_event_id)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (tenant_id, farm_id, product_id) DO UPDATE SET
                  stock_kg = EXCLUDED.stock_kg,
                  last_event_id = EXCLUDED.last_event_id,
                  projection_status = 'current',
                  updated_at = CURRENT_TIMESTAMP
                """,
                (tenant_id, farm_id, product_id, row["stock"], row["last_event_id"]),
            )
