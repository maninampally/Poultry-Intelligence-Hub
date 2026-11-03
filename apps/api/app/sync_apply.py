"""Apply sync push operations to domain tables (Phase 1).

Push first logs an idempotent row in sync_operations, then applies the
mutation. Retries with the same (org, device, idempotency_key) are no-ops.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any
from uuid import UUID

import asyncpg

# Tables clients may mutate via sync push (Phase 1 apply implementations).
PUSHABLE_TABLES = frozenset(
    {
        "daily_records",
        "mortality_records",
    }
)

# Delta pull includes operational tables (+ flocks) even before push-apply exists.
PULLABLE_TABLES = frozenset(
    {
        "flocks",
        "daily_records",
        "mortality_records",
        "feed_records",
        "water_records",
        "weight_records",
        "medicine_records",
        "vaccination_records",
        "health_records",
    }
)

_CAMEL_TO_SNAKE = {
    "flockId": "flock_id",
    "recordDate": "record_date",
    "feedKg": "feed_kg",
    "waterL": "water_l",
    "avgWeightKg": "avg_weight_kg",
    "photoUri": "photo_uri",
    "occurredDate": "occurred_date",
    "orgId": "org_id",
    "birdsPlaced": "birds_placed",
    "placedOn": "placed_on",
    "quantityKg": "quantity_kg",
}


def normalize_payload(data: dict[str, Any]) -> dict[str, Any]:
    """Accept camelCase (mobile) or snake_case payloads."""
    out: dict[str, Any] = {}
    for key, value in data.items():
        out[_CAMEL_TO_SNAKE.get(key, key)] = value
    return out


def _as_uuid(value: Any) -> str:
    return str(UUID(str(value)))


def _as_date(value: Any) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    if isinstance(value, datetime):
        return value.date()
    return date.fromisoformat(str(value)[:10])


async def soft_delete(conn: asyncpg.Connection, table: str, record_id: str) -> None:
    await conn.execute(
        f"update {table} set deleted_at = now() where id = $1 and deleted_at is null",
        record_id,
    )


async def apply_daily_record(
    conn: asyncpg.Connection,
    *,
    org_id: str,
    device_id: str,
    record_id: str,
    data: dict[str, Any],
    user_id: str,
) -> None:
    payload = normalize_payload(data)
    flock_id = _as_uuid(payload["flock_id"])
    record_date = _as_date(payload["record_date"])
    feed_kg = payload.get("feed_kg")
    water_l = payload.get("water_l")
    deaths = payload.get("deaths")
    avg_weight_kg = payload.get("avg_weight_kg")
    notes = payload.get("notes")
    photo_uri = payload.get("photo_uri")
    is_complete = feed_kg is not None and deaths is not None
    rid = _as_uuid(payload.get("id", record_id))

    await conn.execute(
        """
        insert into daily_records
          (id, org_id, flock_id, record_date, feed_kg, water_l, deaths,
           avg_weight_kg, notes, photo_uri, is_complete, created_by, source_device_id)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        on conflict (flock_id, record_date) do update set
          feed_kg = excluded.feed_kg,
          water_l = excluded.water_l,
          deaths = excluded.deaths,
          avg_weight_kg = excluded.avg_weight_kg,
          notes = excluded.notes,
          photo_uri = excluded.photo_uri,
          is_complete = excluded.is_complete,
          source_device_id = excluded.source_device_id,
          deleted_at = null
        """,
        rid,
        org_id,
        flock_id,
        record_date,
        feed_kg,
        water_l,
        deaths,
        avg_weight_kg,
        notes,
        photo_uri,
        is_complete,
        user_id,
        device_id,
    )


async def apply_mortality_record(
    conn: asyncpg.Connection,
    *,
    org_id: str,
    device_id: str,
    record_id: str,
    data: dict[str, Any],
    user_id: str,
) -> None:
    payload = normalize_payload(data)
    rid = _as_uuid(payload.get("id", record_id))
    await conn.execute(
        """
        insert into mortality_records
          (id, org_id, flock_id, occurred_date, count, reason, photo_uri,
           created_by, source_device_id)
        values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        on conflict (id) do update set
          count = excluded.count,
          reason = excluded.reason,
          photo_uri = excluded.photo_uri,
          deleted_at = null
        """,
        rid,
        org_id,
        _as_uuid(payload["flock_id"]),
        _as_date(payload["occurred_date"]),
        int(payload["count"]),
        payload.get("reason"),
        payload.get("photo_uri"),
        user_id,
        device_id,
    )


async def apply_operation(
    conn: asyncpg.Connection,
    *,
    org_id: str,
    device_id: str,
    table_name: str,
    operation: str,
    record_id: str,
    data: dict[str, Any],
    user_id: str,
) -> None:
    if table_name not in PUSHABLE_TABLES:
        raise ValueError(f"table '{table_name}' is not pushable")

    op = operation.lower()
    if op == "delete":
        await soft_delete(conn, table_name, _as_uuid(record_id))
        return

    if op not in {"insert", "update", "upsert"}:
        raise ValueError(f"unsupported operation '{operation}'")

    if table_name == "daily_records":
        await apply_daily_record(
            conn,
            org_id=org_id,
            device_id=device_id,
            record_id=record_id,
            data=data,
            user_id=user_id,
        )
        return

    if table_name == "mortality_records":
        await apply_mortality_record(
            conn,
            org_id=org_id,
            device_id=device_id,
            record_id=record_id,
            data=data,
            user_id=user_id,
        )
        return

    raise ValueError(f"apply for '{table_name}' is not implemented")
