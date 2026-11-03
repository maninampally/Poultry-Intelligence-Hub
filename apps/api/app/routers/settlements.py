"""Settlement compute + persist (manager-only via RLS).

Uses shared `compute_settlement` (integer paise, itemized lines).
Workers cannot read/write these tables — enforced by Postgres RLS.
"""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth
from app.serialize import row_dict
from pih_analytics.settlement import (
    AgreementRule,
    SettlementInput,
    compute_settlement,
)

router = APIRouter(prefix="/api/v1/settlements", tags=["settlements"])


class AgreementRuleIn(BaseModel):
    metric: Literal["fcr", "mortality_pct", "avg_weight"]
    lower_bound: float | None = None
    upper_bound: float | None = None
    adjust_paise_per_bird: int = 0
    description: str = ""


class SettlementComputeBody(BaseModel):
    org_id: str
    flock_id: str
    kind: Literal["independent", "contract"]
    birds_lifted: int = Field(ge=0)
    avg_weight_kg: float = Field(default=0.0, ge=0)
    total_weight_kg: float | None = Field(default=None, ge=0)
    # independent
    rate_paise_per_kg: int = Field(default=0, ge=0)
    adjustments_paise: int = 0
    # contract
    base_charge_paise: int = 0
    base_charge_basis: Literal["per_bird", "per_kg_live"] = "per_bird"
    fcr_value: float | None = None
    mortality_pct_value: float | None = None
    rules: list[AgreementRuleIn] = Field(default_factory=list)
    paid_paise: int | None = None
    notes: str | None = None


class SettlementConfirmBody(BaseModel):
    paid_paise: int
    notes: str | None = None
    status: Literal["confirmed", "disputed"] = "confirmed"


def _to_input(body: SettlementComputeBody) -> SettlementInput:
    return SettlementInput(
        kind=body.kind,
        birds_lifted=body.birds_lifted,
        avg_weight_kg=body.avg_weight_kg,
        total_weight_kg=body.total_weight_kg,
        rate_paise_per_kg=body.rate_paise_per_kg,
        adjustments_paise=body.adjustments_paise,
        base_charge_paise=body.base_charge_paise,
        base_charge_basis=body.base_charge_basis,
        fcr_value=body.fcr_value,
        mortality_pct_value=body.mortality_pct_value,
        rules=[
            AgreementRule(
                metric=r.metric,
                lower_bound=r.lower_bound,
                upper_bound=r.upper_bound,
                adjust_paise_per_bird=r.adjust_paise_per_bird,
                description=r.description,
            )
            for r in body.rules
        ],
    )


@router.post("/compute", status_code=201)
async def compute_and_persist(
    body: SettlementComputeBody, auth: AuthContext = Depends(get_auth)
) -> dict:
    """Run deterministic settlement and upsert settlements + lines for the flock."""
    try:
        result = compute_settlement(_to_input(body))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    variance = None
    if body.paid_paise is not None:
        variance = body.paid_paise - result.total_paise

    async with db.acquire(auth.user_id) as conn:
        settlement = await conn.fetchrow(
            """
            insert into settlements
              (org_id, flock_id, calculated_paise, paid_paise, variance_paise,
               status, notes, created_by)
            values ($1,$2,$3,$4,$5,'draft',$6,$7)
            on conflict (flock_id) do update set
              calculated_paise = excluded.calculated_paise,
              paid_paise = coalesce(excluded.paid_paise, settlements.paid_paise),
              variance_paise = excluded.variance_paise,
              notes = coalesce(excluded.notes, settlements.notes),
              status = 'draft',
              deleted_at = null
            returning id, org_id, flock_id, calculated_paise, paid_paise,
                      variance_paise, status, notes, updated_at
            """,
            body.org_id,
            body.flock_id,
            result.total_paise,
            body.paid_paise,
            variance,
            body.notes,
            auth.user_id,
        )
        if settlement is None:
            raise HTTPException(status_code=403, detail="settlement write denied")

        await conn.execute(
            "delete from settlement_lines where settlement_id = $1",
            settlement["id"],
        )
        for i, line in enumerate(result.lines):
            await conn.execute(
                """
                insert into settlement_lines
                  (org_id, settlement_id, label, amount_paise, detail, sort_order)
                values ($1,$2,$3,$4,$5,$6)
                """,
                body.org_id,
                settlement["id"],
                line.label,
                line.amount_paise,
                line.detail,
                i,
            )

        lines = await conn.fetch(
            """
            select id, label, amount_paise, detail, sort_order
            from settlement_lines
            where settlement_id = $1
            order by sort_order
            """,
            settlement["id"],
        )

    return {
        "settlement": row_dict(settlement),
        "lines": [row_dict(r) for r in lines],
    }


@router.get("/flock/{flock_id}")
async def get_for_flock(
    flock_id: str, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        settlement = await conn.fetchrow(
            """
            select id, org_id, flock_id, calculated_paise, paid_paise,
                   variance_paise, status, notes, updated_at
            from settlements
            where flock_id = $1 and deleted_at is null
            """,
            flock_id,
        )
        if settlement is None:
            raise HTTPException(status_code=404, detail="settlement not found")
        lines = await conn.fetch(
            """
            select id, label, amount_paise, detail, sort_order
            from settlement_lines
            where settlement_id = $1
            order by sort_order
            """,
            settlement["id"],
        )
    return {
        "settlement": row_dict(settlement),
        "lines": [row_dict(r) for r in lines],
    }


@router.post("/flock/{flock_id}/confirm")
async def confirm_settlement(
    flock_id: str,
    body: SettlementConfirmBody,
    auth: AuthContext = Depends(get_auth),
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        row = await conn.fetchrow(
            """
            update settlements
            set paid_paise = $2,
                variance_paise = $2 - coalesce(calculated_paise, 0),
                status = $3,
                notes = coalesce($4, notes)
            where flock_id = $1 and deleted_at is null
            returning id, org_id, flock_id, calculated_paise, paid_paise,
                      variance_paise, status, notes, updated_at
            """,
            flock_id,
            body.paid_paise,
            body.status,
            body.notes,
        )
    if row is None:
        raise HTTPException(status_code=404, detail="settlement not found")
    return row_dict(row)
