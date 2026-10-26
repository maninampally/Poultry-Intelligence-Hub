"""Analytics endpoints — read source data, compute via deterministic engine.

The LLM layer never computes these; it calls these endpoints (or the
underlying functions) and explains the results.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException

from app import db
from app.analytics import (
    average_weight_kg,
    current_birds,
    fcr,
    livability_pct,
    mortality_pct,
)
from app.analytics.metrics import age_in_days
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/flocks/{flock_id}/metrics")
async def flock_metrics(
    flock_id: str, auth: AuthContext = Depends(get_auth)
) -> dict:
    async with db.acquire(auth.user_id) as conn:
        flock = await conn.fetchrow(
            """
            select id, placed_on, birds_placed
            from flocks
            where id = $1 and deleted_at is null
            """,
            flock_id,
        )
        if flock is None:
            raise HTTPException(status_code=404, detail="Flock not found")

        total_deaths = await conn.fetchval("select app_flock_mortality($1)", flock_id)
        total_feed = await conn.fetchval("select app_flock_feed_kg($1)", flock_id)
        latest_weight = await conn.fetchval(
            """
            select avg_weight_kg from weight_records
            where flock_id = $1 and deleted_at is null
            order by occurred_date desc limit 1
            """,
            flock_id,
        )

    placed = flock["birds_placed"] or 0
    deaths = int(total_deaths or 0)
    feed_kg = float(total_feed or 0)
    birds = current_birds(placed, deaths) if placed else 0

    age = None
    if flock["placed_on"]:
        age = age_in_days(flock["placed_on"], date.today())

    avg_w = float(latest_weight) if latest_weight is not None else None
    # live weight gain assumes ~0.045 kg chick placement weight (placeholder).
    gain = None
    provisional_fcr = None
    if avg_w is not None and birds > 0:
        total_live_weight = avg_w * birds
        gain = total_live_weight - (0.045 * placed)  # PLACEHOLDER chick weight
        provisional_fcr = fcr(feed_kg, gain) if gain and gain > 0 else None

    return {
        "flock_id": flock_id,
        "age_days": age,
        "birds_placed": placed,
        "current_birds": birds,
        "total_mortality": deaths,
        "mortality_pct": mortality_pct(deaths, placed) if placed else None,
        "livability_pct": livability_pct(birds, placed) if placed else None,
        "avg_weight_kg": avg_w,
        "total_feed_kg": feed_kg,
        "provisional_fcr": provisional_fcr,
    }
