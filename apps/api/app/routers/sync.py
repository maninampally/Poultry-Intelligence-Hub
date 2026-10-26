"""Offline-first sync: idempotent push + cursor-based delta pull.

Push: each operation carries an idempotency_key unique per (org, device).
Re-pushing the same key is a safe no-op (ON CONFLICT DO NOTHING), so retries
never duplicate. This endpoint records the operation log; the actual row
write is performed by the domain endpoints / a relay worker in production.
This scaffold records the operation and echoes accepted/duplicate status.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


class SyncOperation(BaseModel):
    idempotency_key: str
    table_name: str
    operation: str  # insert | update | upsert | delete
    record_id: str
    data: dict


class PushRequest(BaseModel):
    org_id: str
    device_id: str | None = None
    operations: list[SyncOperation]


class RegisterDevice(BaseModel):
    org_id: str
    name: str | None = None
    platform: str | None = None


@router.post("/register-device", status_code=201)
async def register_device(
    body: RegisterDevice, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into devices (org_id, user_id, name, platform, last_seen_at)
            values ($1,$2,$3,$4, now())
            returning id
            """,
            body.org_id, auth.user_id, body.name, body.platform,
        )
    return {"device_id": str(row["id"])}


@router.post("/push")
async def push(body: PushRequest, auth: AuthContext = Depends(get_auth)) -> dict:
    results = []
    accepted = duplicates = 0
    async with db.acquire(auth.user_id) as conn:
        for op in body.operations:
            inserted = await conn.fetchval(
                """
                insert into sync_operations
                  (org_id, device_id, idempotency_key, table_name,
                   operation, record_id, data, status)
                values ($1,$2,$3,$4,$5,$6,$7,'synced')
                on conflict (org_id, device_id, idempotency_key) do nothing
                returning id
                """,
                body.org_id, body.device_id, op.idempotency_key,
                op.table_name, op.operation, op.record_id,
                json.dumps(op.data),
            )
            if inserted is None:
                duplicates += 1
                results.append(
                    {"idempotency_key": op.idempotency_key, "status": "duplicate"}
                )
            else:
                accepted += 1
                results.append(
                    {
                        "idempotency_key": op.idempotency_key,
                        "status": "accepted",
                        "record_id": op.record_id,
                    }
                )
    return {
        "results": results,
        "summary": {
            "total": len(body.operations),
            "accepted": accepted,
            "duplicates": duplicates,
        },
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


def _encode_cursor(ts: datetime) -> str:
    return base64.urlsafe_b64encode(
        json.dumps({"since": ts.isoformat()}).encode()
    ).decode()


def _decode_cursor(cursor: str | None) -> datetime:
    if not cursor:
        return datetime.fromtimestamp(0, tz=timezone.utc)
    data = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
    return datetime.fromisoformat(data["since"])


@router.get("/pull")
async def pull(
    table: str,
    cursor: str | None = None,
    auth: AuthContext = Depends(get_auth),
) -> dict:
    """Delta pull of a whitelisted operational table since a cursor."""
    allowed = {
        "flocks", "daily_records", "mortality_records", "feed_records",
        "water_records", "weight_records", "medicine_records",
        "vaccination_records", "health_records",
    }
    if table not in allowed:
        return {"error": f"table '{table}' not pullable", "rows": []}

    since = _decode_cursor(cursor)
    async with db.acquire(auth.user_id) as conn:
        rows = await conn.fetch(
            f"""
            select * from {table}
            where updated_at > $1 and deleted_at is null
            order by updated_at asc
            limit 500
            """,
            since,
        )
    next_cursor = (
        _encode_cursor(rows[-1]["updated_at"]) if rows else cursor
    )
    return {
        "rows": [dict(r) for r in rows],
        "cursor": next_cursor,
        "has_more": len(rows) == 500,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
