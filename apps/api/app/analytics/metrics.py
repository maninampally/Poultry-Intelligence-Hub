"""Core flock performance metrics — pure, deterministic functions.

Formulas follow Poultry_Intelligence_Production_Product_Direction.md §27:

    Mortality %  = dead / placed * 100
    Livability % = sold / placed * 100   (post-lifting)
    Avg weight   = total live weight / birds sold
    FCR          = feed consumed / live weight gain

All functions return None when inputs are insufficient (e.g. zero birds),
never raise on ordinary "no data yet" cases. Negative inputs raise ValueError
because they indicate a programming/validation error upstream.
"""

from __future__ import annotations

from datetime import date
from typing import Literal, Optional, Sequence

Status = Literal["normal", "watch", "act"]


def _require_non_negative(**values: Optional[float]) -> None:
    for name, v in values.items():
        if v is not None and v < 0:
            raise ValueError(f"{name} must be non-negative, got {v}")


def age_in_days(placed_on: date, today: date) -> int:
    """Flock age in days. Day of placement is day 0."""
    delta = (today - placed_on).days
    if delta < 0:
        raise ValueError("today is before placed_on")
    return delta


def current_birds(placed: int, total_deaths: int) -> int:
    """Live birds remaining = placed - deaths (floored at 0)."""
    _require_non_negative(placed=placed, total_deaths=total_deaths)
    return max(placed - total_deaths, 0)


def mortality_pct(deaths: int, placed: int) -> Optional[float]:
    """Cumulative mortality as a percentage of birds placed."""
    _require_non_negative(deaths=deaths, placed=placed)
    if placed == 0:
        return None
    return deaths / placed * 100.0


def livability_pct(sold: int, placed: int) -> Optional[float]:
    """Livability = birds sold / birds placed * 100."""
    _require_non_negative(sold=sold, placed=placed)
    if placed == 0:
        return None
    return sold / placed * 100.0


def average_weight_kg(total_live_weight_kg: float, birds_sold: int) -> Optional[float]:
    """Average sold-bird weight = total live weight / birds sold."""
    _require_non_negative(total_live_weight_kg=total_live_weight_kg, birds_sold=birds_sold)
    if birds_sold == 0:
        return None
    return total_live_weight_kg / birds_sold


def fcr(feed_consumed_kg: float, live_weight_gain_kg: float) -> Optional[float]:
    """Feed Conversion Ratio = feed consumed / live weight gain.

    Lower is better. Returns None when there is no measurable weight gain.
    """
    _require_non_negative(
        feed_consumed_kg=feed_consumed_kg, live_weight_gain_kg=live_weight_gain_kg
    )
    if live_weight_gain_kg <= 0:
        return None
    return feed_consumed_kg / live_weight_gain_kg


def deviation_pct(actual: float, expected: float) -> Optional[float]:
    """Percentage deviation of actual from expected: (actual-expected)/expected*100.

    Positive = above expected, negative = below. None when expected is 0.
    """
    if expected == 0:
        return None
    return (actual - expected) / expected * 100.0


def status_from_deviation(
    deviation: Optional[float],
    watch_at: float,
    act_at: float,
) -> Status:
    """Map an absolute deviation to a status band.

    watch_at / act_at are absolute percentage thresholds (e.g. 5, 10).
    A None deviation (no expected value) is treated as 'normal'.
    """
    if deviation is None:
        return "normal"
    mag = abs(deviation)
    if mag >= act_at:
        return "act"
    if mag >= watch_at:
        return "watch"
    return "normal"


def feed_runway_days(
    feed_stock_kg: float, recent_daily_feed_kg: Sequence[float]
) -> Optional[int]:
    """Estimate days of feed remaining from current stock and recent usage.

    Uses the average of the supplied recent daily feed figures. Returns None
    if there is no usage history or the average is zero.
    """
    _require_non_negative(feed_stock_kg=feed_stock_kg)
    usable = [f for f in recent_daily_feed_kg if f is not None and f >= 0]
    if not usable:
        return None
    avg = sum(usable) / len(usable)
    if avg == 0:
        return None
    return int(feed_stock_kg // avg)
