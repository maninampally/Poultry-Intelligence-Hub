"""Financial metrics — integer paise arithmetic only (AGENTS.md rule #7).

₹1.00 == 100 paise. We never use floats for money. Division results are
rounded to the nearest paisa with banker's-rounding avoided in favour of
round-half-up, which matches how farmers expect currency to round.
"""

from __future__ import annotations

from typing import Optional


def _round_half_up(numerator: int, denominator: int) -> int:
    """Integer division rounding halves up, for positive denominators."""
    if denominator <= 0:
        raise ValueError("denominator must be positive")
    # (num + denom/2) // denom, done without floats; handle sign of numerator.
    if numerator >= 0:
        return (numerator * 2 + denominator) // (2 * denominator)
    return -((-numerator * 2 + denominator) // (2 * denominator))


def total_cost_paise(
    feed_cost_paise: int = 0,
    chick_cost_paise: int = 0,
    medicine_cost_paise: int = 0,
    labor_cost_paise: int = 0,
    other_cost_paise: int = 0,
) -> int:
    """Sum of all production cost components, in paise."""
    parts = [
        feed_cost_paise,
        chick_cost_paise,
        medicine_cost_paise,
        labor_cost_paise,
        other_cost_paise,
    ]
    for p in parts:
        if p < 0:
            raise ValueError("cost components must be non-negative")
    return sum(parts)


def cost_per_bird_paise(total_cost_paise: int, birds_placed: int) -> Optional[int]:
    """Production cost per bird placed, in paise."""
    if total_cost_paise < 0:
        raise ValueError("total_cost_paise must be non-negative")
    if birds_placed <= 0:
        return None
    return _round_half_up(total_cost_paise, birds_placed)


def cost_per_kg_paise(total_cost_paise: int, total_live_weight_kg: float) -> Optional[int]:
    """Production cost per kg of live weight, in paise.

    Weight is a float (kg). We scale kg to integer grams to keep the
    division deterministic, then compute paise-per-kg = cost / kg directly
    (cost * 1000 grams-per-kg / grams) with a single round-half-up.
    """
    if total_cost_paise < 0:
        raise ValueError("total_cost_paise must be non-negative")
    if total_live_weight_kg <= 0:
        return None
    grams = int(round(total_live_weight_kg * 1000))
    if grams <= 0:
        return None
    # cost_per_kg = total_cost / kg = total_cost / (grams/1000) = total_cost*1000/grams
    return _round_half_up(total_cost_paise * 1000, grams)


def profit_per_bird_paise(
    net_settlement_paise: int, total_cost_paise: int, birds_placed: int
) -> Optional[int]:
    """Profit per bird = (net settlement - total cost) / birds placed, in paise.

    Can be negative (a loss). Returns None when no birds were placed.
    """
    if birds_placed <= 0:
        return None
    profit = net_settlement_paise - total_cost_paise
    # Signed round-half-up toward the profit's sign.
    if profit >= 0:
        return _round_half_up(profit, birds_placed)
    return -_round_half_up(-profit, birds_placed)
