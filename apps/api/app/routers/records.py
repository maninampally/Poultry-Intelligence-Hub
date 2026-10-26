"""Daily records (upsert one per flock per date) + list."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/records", tags=["records"])


class DailyRecordUpsert(BaseModel):
    org_id: str
    flock_id: str
    record_date: date
    feed_kg: float | None = Field(default=None, ge=0)
    water_l: float | None = Field(default=None, ge=0)
    deaths: int | None = Field(default=None, ge=0)
    avg_weight_kg: float | None = Field(default=None, ge=0)
    notes: str | None = None


@router.get("/daily/{flock_id}")
async def list_daily(
    flock_id: str, auth: AuthContext = Depends(get_auth)
) -> list[dict]:
    async with db.acquire(auth.user_id) as conn:
        rows = await conn.fetch(
            """
            select id, flock_id, record_date, feed_kg, water_l, deaths,
                   avg_weight_kg, notes, is_complete, updated_at
            from daily_records
            where flock_id = $1 and deleted_at is null
            order by record_date desc
            """,
            flock_id,
        )
    return [dict(r) for r in rows]


@router.put("/daily")
async def upsert_daily(
    body: DailyRecordUpsert, auth: AuthContext = Depends(get_auth)
) -> dict:
    is_complete = body.feed_kg is not None and body.deaths is not None
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into daily_records
              (org_id, flock_id, record_date, feed_kg, water_l, deaths,
               avg_weight_kg, notes, is_complete, created_by)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
            on conflict (flock_id, record_date) do update set
              feed_kg = excluded.feed_kg,
              water_l = excluded.water_l,
              deaths = excluded.deaths,
              avg_weight_kg = excluded.avg_weight_kg,
              notes = excluded.notes,
              is_complete = excluded.is_complete
            returning id, flock_id, record_date, feed_kg, water_l, deaths,
                      avg_weight_kg, notes, is_complete, updated_at
            """,
            body.org_id, body.flock_id, body.record_date, body.feed_kg,
            body.water_l, body.deaths, body.avg_weight_kg, body.notes,
            is_complete, auth.user_id,
        )
    return dict(row)
