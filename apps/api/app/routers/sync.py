"""Offline-first sync: idempotent push (apply) + keyset delta pull.

Phase 1: push requires device_id, logs sync_operations, applies domain
writes for supported tables, and pull uses (updated_at, id) cursors with
soft-delete tombstones + sync_cursors persistence.
"""

from __future__ import annotations

import base64
import json
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth
from app.jobs import enqueue_flock_rebuild
from app.sync_apply import PULLABLE_TABLES, PUSHABLE_TABLES, apply_operation

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


class SyncOperation(BaseModel):
    idempotency_key: str = Field(min_length=1)
    table_name: str
    operation: str  # insert | update | upsert | delete
    record_id: str
    data: dict[str, Any] = Field(default_factory=dict)


class PushRequest(BaseModel):
    org_id: str
    device_id: str
    operations: list[SyncOperation]


class RegisterDevice(BaseModel):
    org_id: str
    name: str | None = None
    platform: str | None = None


def _encode_cursor(updated_at: datetime, record_id: str) -> str:
    payload = {"u": updated_at.astimezone(timezone.utc).isoformat(), "id": record_id}
    return base64.urlsafe_b64encode(json.dumps(payload).encode()).decode()


def _decode_cursor(cursor: str | None) -> tuple[datetime, str]:
    """Return (updated_at, id) keyset position. Epoch + zero UUID when absent."""
    if not cursor:
        return datetime.fromtimestamp(0, tz=timezone.utc), "00000000-0000-0000-0000-000000000000"
    try:
        data = json.loads(base64.urlsafe_b64decode(cursor.encode()).decode())
        # Legacy cursor: {"since": iso} — treat id as zero
        if "since" in data and "u" not in data:
            return datetime.fromisoformat(data["since"]), "00000000-0000-0000-0000-000000000000"
        return datetime.fromisoformat(data["u"]), str(data["id"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"invalid cursor: {exc}") from exc


def _row_to_jsonable(row: Any) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for key, value in dict(row).items():
        if isinstance(value, datetime):
            out[key] = value.astimezone(timezone.utc).isoformat()
        elif isinstance(value, UUID):
            out[key] = str(value)
        else:
            out[key] = value
    return out


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
            body.org_id,
            auth.user_id,
            body.name,
            body.platform,
        )
    return {"device_id": str(row["id"])}


@router.post("/push")
async def push(body: PushRequest, auth: AuthContext = Depends(get_auth)) -> dict:
    try:
        device_id = str(UUID(body.device_id))
        org_id = str(UUID(body.org_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="org_id and device_id must be UUIDs") from exc

    results: list[dict[str, Any]] = []
    accepted = duplicates = failed = 0
    flocks_to_rebuild: set[str] = set()

    async with db.acquire(auth.user_id) as conn:
        # Prove device belongs to this org (RLS + explicit check).
        device = await conn.fetchrow(
            "select id from devices where id = $1 and org_id = $2",
            device_id,
            org_id,
        )
        if device is None:
            raise HTTPException(status_code=404, detail="device not found for org")

        await conn.execute(
            "update devices set last_seen_at = now() where id = $1",
            device_id,
        )

        for op in body.operations:
            if op.table_name not in PUSHABLE_TABLES:
                failed += 1
                results.append(
                    {
                        "idempotency_key": op.idempotency_key,
                        "status": "failed",
                        "error": f"table '{op.table_name}' is not pushable",
                    }
                )
                continue

            try:
                record_uuid = str(UUID(op.record_id))
            except ValueError:
                failed += 1
                results.append(
                    {
                        "idempotency_key": op.idempotency_key,
                        "status": "failed",
                        "error": "record_id must be a UUID",
                    }
                )
                continue

            # Savepoint per op so one failure does not unwind prior applies.
            async with conn.transaction():
                existing = await conn.fetchrow(
                    """
                    select id, status from sync_operations
                    where org_id = $1 and device_id = $2 and idempotency_key = $3
                    """,
                    org_id,
                    device_id,
                    op.idempotency_key,
                )
                if existing is not None and existing["status"] == "synced":
                    duplicates += 1
                    results.append(
                        {"idempotency_key": op.idempotency_key, "status": "duplicate"}
                    )
                    continue

                if existing is None:
                    sync_id = await conn.fetchval(
                        """
                        insert into sync_operations
                          (org_id, device_id, idempotency_key, table_name,
                           operation, record_id, data, status)
                        values ($1,$2,$3,$4,$5::sync_op,$6,$7::jsonb,'pending')
                        returning id
                        """,
                        org_id,
                        device_id,
                        op.idempotency_key,
                        op.table_name,
                        op.operation.lower(),
                        record_uuid,
                        json.dumps(op.data),
                    )
                else:
                    sync_id = existing["id"]
                    await conn.execute(
                        """
                        update sync_operations
                        set table_name = $2, operation = $3::sync_op,
                            record_id = $4, data = $5::jsonb,
                            status = 'pending', error_message = null
                        where id = $1
                        """,
                        sync_id,
                        op.table_name,
                        op.operation.lower(),
                        record_uuid,
                        json.dumps(op.data),
                    )

                try:
                    async with conn.transaction():
                        await apply_operation(
                            conn,
                            org_id=org_id,
                            device_id=device_id,
                            table_name=op.table_name,
                            operation=op.operation,
                            record_id=record_uuid,
                            data=op.data,
                            user_id=auth.user_id,
                        )
                    await conn.execute(
                        "update sync_operations set status = 'synced' where id = $1",
                        sync_id,
                    )
                    accepted += 1
                    flock_hint = op.data.get("flock_id") or op.data.get("flockId")
                    if flock_hint:
                        flocks_to_rebuild.add(str(flock_hint))
                    results.append(
                        {
                            "idempotency_key": op.idempotency_key,
                            "status": "accepted",
                            "record_id": record_uuid,
                        }
                    )
                except Exception as exc:
                    await conn.execute(
                        """
                        update sync_operations
                        set status = 'failed', error_message = $2
                        where id = $1
                        """,
                        sync_id,
                        str(exc)[:500],
                    )
                    failed += 1
                    results.append(
                        {
                            "idempotency_key": op.idempotency_key,
                            "status": "failed",
                            "error": str(exc),
                        }
                    )

    for flock_id in flocks_to_rebuild:
        enqueue_flock_rebuild(flock_id)

    return {
        "results": results,
        "summary": {
            "total": len(body.operations),
            "accepted": accepted,
            "duplicates": duplicates,
            "failed": failed,
        },
        "server_time": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/pull")
async def pull(
    table: str,
    device_id: str = Query(..., description="Registered device UUID"),
    org_id: str = Query(..., description="Organization UUID"),
    cursor: str | None = None,
    auth: AuthContext = Depends(get_auth),
) -> dict:
    """Delta pull with keyset pagination and soft-delete tombstones."""
    if table not in PULLABLE_TABLES:
        raise HTTPException(status_code=400, detail=f"table '{table}' not pullable")

    try:
        device_uuid = str(UUID(device_id))
        org_uuid = str(UUID(org_id))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="org_id and device_id must be UUIDs") from exc

    since_ts, since_id = _decode_cursor(cursor)

    async with db.acquire(auth.user_id) as conn:
        device = await conn.fetchrow(
            "select id from devices where id = $1 and org_id = $2",
            device_uuid,
            org_uuid,
        )
        if device is None:
            raise HTTPException(status_code=404, detail="device not found for org")

        # Include tombstones (deleted_at set) so clients can drop local rows.
        rows = await conn.fetch(
            f"""
            select *
            from {table}
            where org_id = $1
              and (
                updated_at > $2
                or (updated_at = $2 and id > $3::uuid)
              )
            order by updated_at asc, id asc
            limit 500
            """,
            org_uuid,
            since_ts,
            since_id,
        )

        next_cursor = cursor
        if rows:
            last = rows[-1]
            next_cursor = _encode_cursor(last["updated_at"], str(last["id"]))
            await conn.execute(
                """
                insert into sync_cursors (org_id, device_id, table_name, last_pulled_at)
                values ($1, $2, $3, $4)
                on conflict (device_id, table_name) do update set
                  last_pulled_at = excluded.last_pulled_at,
                  org_id = excluded.org_id
                """,
                org_uuid,
                device_uuid,
                table,
                last["updated_at"],
            )

    return {
        "rows": [_row_to_jsonable(r) for r in rows],
        "cursor": next_cursor,
        "has_more": len(rows) == 500,
        "server_time": datetime.now(timezone.utc).isoformat(),
    }
