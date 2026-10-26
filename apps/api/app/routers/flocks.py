"""Flock lifecycle CRUD + status transitions."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/flocks", tags=["flocks"])

# Allowed lifecycle transitions (Production Direction §8).
TRANSITIONS: dict[str, set[str]] = {
    "planned": {"placed"},
    "placed": {"growing"},
    "growing": {"ready_for_lifting"},
    "ready_for_lifting": {"partially_lifted", "final_lifting"},
    "partially_lifted": {"partially_lifted", "final_lifting"},
    "final_lifting": {"settlement"},
    "settlement": {"completed"},
    "completed": {"archived"},
    "archived": set(),
}


class FlockCreate(BaseModel):
    org_id: str
    farm_id: str
    shed_id: str | None = None
    name: str = Field(min_length=1)
    placed_on: date | None = None
    birds_placed: int | None = Field(default=None, gt=0)
    breed: str | None = None


class StatusChange(BaseModel):
    to_status: str
    note: str | None = None


@router.get("")
async def list_flocks(auth: AuthContext = Depends(get_auth)) -> list[dict]:
    async with db.acquire(auth.user_id) as conn:
        rows = await conn.fetch(
            """
            select id, org_id, farm_id, shed_id, name, status,
                   placed_on, birds_placed, breed, created_at
            from flocks
            where deleted_at is null
            order by created_at desc
            """
        )
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_flock(
    body: FlockCreate, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into flocks
              (org_id, farm_id, shed_id, name, placed_on, birds_placed, breed, created_by)
            values ($1,$2,$3,$4,$5,$6,$7,$8)
            returning id, org_id, farm_id, shed_id, name, status,
                      placed_on, birds_placed, breed, created_at
            """,
            body.org_id, body.farm_id, body.shed_id, body.name,
            body.placed_on, body.birds_placed, body.breed, auth.user_id,
        )
    return dict(row)


@router.post("/{flock_id}/status")
async def change_status(
    flock_id: str, body: StatusChange, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        current = await conn.fetchrow(
            "select status, org_id from flocks where id = $1 and deleted_at is null",
            flock_id,
        )
        if current is None:
            raise HTTPException(status_code=404, detail="Flock not found")
        from_status = current["status"]
        if body.to_status not in TRANSITIONS.get(from_status, set()):
            raise HTTPException(
                status_code=400,
                detail=f"Illegal transition {from_status} -> {body.to_status}",
            )
        await conn.execute(
            "update flocks set status = $1 where id = $2",
            body.to_status, flock_id,
        )
        await conn.execute(
            """
            insert into flock_status_history
              (org_id, flock_id, from_status, to_status, changed_by, note)
            values ($1,$2,$3,$4,$5,$6)
            """,
            current["org_id"], flock_id, from_status, body.to_status,
            auth.user_id, body.note,
        )
    return {"flock_id": flock_id, "from": from_status, "to": body.to_status}
