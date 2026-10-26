"""Lifting events (finance/manager scope; RLS blocks workers)."""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/lifting", tags=["lifting"])


class LiftingCreate(BaseModel):
    org_id: str
    flock_id: str
    counterparty_id: str | None = None
    occurred_date: date
    vehicle_number: str | None = None
    birds_lifted: int = Field(ge=0)
    avg_weight_kg: float | None = Field(default=None, ge=0)
    total_weight_kg: float | None = Field(default=None, ge=0)
    rate_paise_per_kg: int | None = Field(default=None, ge=0)
    adjustments_paise: int = 0
    is_final: bool = False
    notes: str | None = None


@router.get("/{flock_id}")
async def list_lifting(
    flock_id: str, auth: AuthContext = Depends(get_auth)
) -> list[dict]:
    async with db.acquire(auth.user_id) as conn:
        rows = await conn.fetch(
            """
            select id, flock_id, counterparty_id, occurred_date, vehicle_number,
                   birds_lifted, avg_weight_kg, total_weight_kg, rate_paise_per_kg,
                   gross_amount_paise, adjustments_paise, net_amount_paise,
                   is_final, payment_status, created_at
            from lifting_events
            where flock_id = $1 and deleted_at is null
            order by occurred_date asc
            """,
            flock_id,
        )
    return [dict(r) for r in rows]


@router.post("", status_code=201)
async def create_lifting(
    body: LiftingCreate, auth: AuthContext = Depends(get_auth)
) -> dict:
    # Deterministic gross/net in paise.
    weight = body.total_weight_kg
    if weight is None and body.avg_weight_kg is not None:
        weight = body.avg_weight_kg * body.birds_lifted
    gross = None
    net = None
    if weight is not None and body.rate_paise_per_kg is not None:
        gross = int(round(weight * body.rate_paise_per_kg))
        net = gross + body.adjustments_paise

    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            insert into lifting_events
              (org_id, flock_id, counterparty_id, occurred_date, vehicle_number,
               birds_lifted, avg_weight_kg, total_weight_kg, rate_paise_per_kg,
               gross_amount_paise, adjustments_paise, net_amount_paise,
               is_final, created_by)
            values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            returning id, flock_id, occurred_date, birds_lifted,
                      gross_amount_paise, net_amount_paise, is_final
            """,
            body.org_id, body.flock_id, body.counterparty_id, body.occurred_date,
            body.vehicle_number, body.birds_lifted, body.avg_weight_kg,
            weight, body.rate_paise_per_kg, gross, body.adjustments_paise,
            net, body.is_final, auth.user_id,
        )
    return dict(row)
