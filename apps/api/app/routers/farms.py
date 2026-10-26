"""Farms & sheds CRUD (RLS enforces org scoping; managers write)."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/farms", tags=["farms"])


class FarmCreate(BaseModel):
    org_id: str
    name: str = Field(min_length=1)
    location: str | None = None


class ShedCreate(BaseModel):
    org_id: str
    name: str = Field(min_length=1)
    capacity: int | None = Field(default=None, gt=0)


@router.get("")
async def list_farms(auth: AuthContext = Depends(get_auth)) -> list[dict]:
    async with db.acquire(auth.user_id) as conn:
        rows = await conn.fetch(
            """
            select id, org_id, name, location, created_at
            from farms
            where deleted_at is null
            order by created_at desc
            """
        )
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_farm(
    body: FarmCreate, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into farms (org_id, name, location, created_by)
            values ($1, $2, $3, $4)
            returning id, org_id, name, location, created_at
            """,
            body.org_id,
            body.name,
            body.location,
            auth.user_id,
        )
    return dict(row)


@router.post("/{farm_id}/sheds", status_code=201)
async def add_shed(
    farm_id: str, body: ShedCreate, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into sheds (org_id, farm_id, name, capacity)
            values ($1, $2, $3, $4)
            returning id, org_id, farm_id, name, capacity, created_at
            """,
            body.org_id,
            farm_id,
            body.name,
            body.capacity,
        )
    return dict(row)
