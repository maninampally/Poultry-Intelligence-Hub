"""Celery application bootstrap."""

import os
from uuid import UUID

from celery import Celery

from murgi_mitra.workers.metrics import rebuild_batch_metrics
from murgi_mitra.workers.feed import rebuild_feed_stock
from murgi_mitra.workers.finance import rebuild_batch_financials
from murgi_mitra.core.database import transaction

broker_url = os.getenv("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")

celery_app = Celery("murgi_mitra", broker=broker_url)
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)


@celery_app.task(name="metrics.rebuild_batch")
def rebuild_batch_metrics_task(batch_id: str) -> None:
    rebuild_batch_metrics(UUID(batch_id))


@celery_app.task(name="feed.rebuild_stock")
def rebuild_feed_stock_task(tenant_id: str, farm_id: str, product_id: str) -> None:
    rebuild_feed_stock(UUID(tenant_id), UUID(farm_id), UUID(product_id))


@celery_app.task(name="finance.rebuild_batch")
def rebuild_batch_financials_task(batch_id: str) -> None:
    rebuild_batch_financials(UUID(batch_id))


@celery_app.task(name="outbox.relay")
def relay_outbox_task(limit: int = 100) -> int:
    published = 0
    with transaction() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT o.id, o.topic, e.batch_id, e.tenant_id, e.farm_id,
                       e.payload
                FROM internal.outbox_events o
                JOIN app.farm_events e ON e.id = o.event_id
                WHERE o.status = 'pending' AND o.available_at <= CURRENT_TIMESTAMP
                ORDER BY o.created_at
                FOR UPDATE OF o SKIP LOCKED
                LIMIT %s
                """,
                (limit,),
            )
            events = cursor.fetchall()
            for outbox_id, topic, batch_id, tenant_id, farm_id, payload in events:
                if topic in ("mortality.logged", "weight-sample.logged") and batch_id:
                    rebuild_batch_metrics_task.delay(str(batch_id))
                elif topic == "expense-entry.logged" or topic == "sale-record.logged":
                    if batch_id:
                        rebuild_batch_financials_task.delay(str(batch_id))
                elif topic == "feed.inventory.moved":
                    product_id = payload.get("product_id") if isinstance(payload, dict) else None
                    if product_id:
                        rebuild_feed_stock_task.delay(str(tenant_id), str(farm_id), str(product_id))
                else:
                    raise ValueError(f"Unsupported outbox topic: {topic}")
                cursor.execute(
                    "UPDATE internal.outbox_events SET status = 'published', published_at = CURRENT_TIMESTAMP "
                    "WHERE id = %s",
                    (outbox_id,),
                )
                published += 1
    return published
