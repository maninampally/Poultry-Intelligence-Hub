"""Rebuild flock_metrics projections using shared pih_analytics."""

from __future__ import annotations

import os
from datetime import date
from typing import Any

import asyncpg
from pih_analytics import (
    age_in_days,
    current_birds,
    fcr,
    livability_pct,
    mortality_pct,
)

# PLACEHOLDER until breed standards table lands (Phase 2.4).
DEFAULT_CHICK_WEIGHT_KG = float(os.getenv("CHICK_PLACEMENT_WEIGHT_KG", "0.045"))

# PLACEHOLDER alert thresholds (product owner / vet to replace via DECISIONS).
MORTALITY_WATCH_PCT = float(os.getenv("ALERT_MORTALITY_WATCH_PCT", "3.0"))
MORTALITY_ACT_PCT = float(os.getenv("ALERT_MORTALITY_ACT_PCT", "5.0"))


async def _connect() -> asyncpg.Connection:
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL is required for projection rebuild")
    return await asyncpg.connect(dsn)


async def compute_and_upsert_flock_metrics(flock_id: str) -> dict[str, Any]:
    conn = await _connect()
    try:
        flock = await conn.fetchrow(
            """
            select id, org_id, farm_id, placed_on, birds_placed
            from flocks
            where id = $1::uuid and deleted_at is null
            """,
            flock_id,
        )
        if flock is None:
            return {"flock_id": flock_id, "status": "missing"}

        total_deaths = int(
            await conn.fetchval("select app_flock_mortality($1::uuid)", flock_id) or 0
        )
        total_feed = float(
            await conn.fetchval("select app_flock_feed_kg($1::uuid)", flock_id) or 0
        )
        birds_sold = int(
            await conn.fetchval(
                """
                select coalesce(sum(birds_lifted), 0)::integer
                from lifting_events
                where flock_id = $1::uuid and deleted_at is null
                """,
                flock_id,
            )
            or 0
        )
        latest_weight = await conn.fetchval(
            """
            select avg_weight_kg from weight_records
            where flock_id = $1::uuid and deleted_at is null
            order by occurred_date desc limit 1
            """,
            flock_id,
        )
        last_record_date = await conn.fetchval(
            """
            select max(record_date) from daily_records
            where flock_id = $1::uuid and deleted_at is null
            """,
            flock_id,
        )
        complete_days = int(
            await conn.fetchval(
                """
                select count(*)::integer from daily_records
                where flock_id = $1::uuid and deleted_at is null and is_complete
                """,
                flock_id,
            )
            or 0
        )

        placed = int(flock["birds_placed"] or 0)
        birds = current_birds(placed, total_deaths) if placed else 0
        age = (
            age_in_days(flock["placed_on"], date.today())
            if flock["placed_on"]
            else None
        )
        avg_w = float(latest_weight) if latest_weight is not None else None
        provisional_fcr = None
        if avg_w is not None and birds > 0 and placed > 0:
            gain = avg_w * birds - (DEFAULT_CHICK_WEIGHT_KG * placed)
            provisional_fcr = fcr(total_feed, gain) if gain and gain > 0 else None

        mort_pct = mortality_pct(total_deaths, placed) if placed else None
        live_pct = (
            livability_pct(birds_sold, placed) if placed and birds_sold > 0 else None
        )
        completeness = None
        if age is not None and age > 0:
            completeness = min(100, int(round(complete_days / age * 100)))
        elif age == 0:
            completeness = 100 if complete_days > 0 else 0

        await conn.execute(
            """
            select app_upsert_flock_metrics(
              $1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            """,
            flock_id,
            flock["org_id"],
            age,
            birds,
            total_deaths,
            mort_pct,
            live_pct,
            avg_w,
            total_feed,
            provisional_fcr,
            None,  # feed_runway_days — needs stock; Phase 2.5+
            completeness,
            last_record_date,
        )

        return {
            "flock_id": flock_id,
            "status": "rebuilt",
            "current_birds": birds,
            "mortality_pct": mort_pct,
            "provisional_fcr": provisional_fcr,
            "org_id": str(flock["org_id"]),
            "farm_id": str(flock["farm_id"]) if flock["farm_id"] else None,
        }
    finally:
        await conn.close()


async def evaluate_flock_alerts(flock_id: str) -> dict[str, Any]:
    """Insert notifications for mortality thresholds (placeholder bands)."""
    metrics = await compute_and_upsert_flock_metrics(flock_id)
    if metrics.get("status") != "rebuilt":
        return {"flock_id": flock_id, "alerts": 0, "status": metrics.get("status")}

    mort = metrics.get("mortality_pct")
    if mort is None:
        return {"flock_id": flock_id, "alerts": 0, "status": "no_mortality_data"}

    severity = None
    if mort >= MORTALITY_ACT_PCT:
        severity = "act"
    elif mort >= MORTALITY_WATCH_PCT:
        severity = "watch"

    if severity is None:
        return {"flock_id": flock_id, "alerts": 0, "status": "ok"}

    conn = await _connect()
    try:
        title = (
            "Mortality needs action"
            if severity == "act"
            else "Mortality elevated — watch"
        )
        body = (
            f"Cumulative mortality is {mort:.1f}% "
            f"(watch {MORTALITY_WATCH_PCT:g}%, act {MORTALITY_ACT_PCT:g}%). "
            "Thresholds are placeholders until farm standards are confirmed."
        )
        notif_id = await conn.fetchval(
            """
            select app_insert_notification(
              $1::uuid, $2::uuid, $3::uuid,
              'mortality_spike', $4, $5, $6, 'flock/metrics'
            )
            """,
            metrics["org_id"],
            metrics.get("farm_id"),
            flock_id,
            severity,
            title,
            body,
        )
        return {
            "flock_id": flock_id,
            "alerts": 1,
            "status": "alerted",
            "notification_id": str(notif_id),
            "severity": severity,
        }
    finally:
        await conn.close()
