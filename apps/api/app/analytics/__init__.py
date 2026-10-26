"""Deterministic analytics for Poultry Intelligence Hub.

Per AGENTS.md rule #8: all farm calculations (FCR, mortality %, livability,
average weight, cost/bird, settlement) are deterministic code. The LLM layer
may only explain these results, never compute them.

Money is handled in integer paise everywhere (AGENTS.md rule #7).
"""

from app.analytics.metrics import (
    age_in_days,
    current_birds,
    mortality_pct,
    livability_pct,
    average_weight_kg,
    fcr,
    deviation_pct,
    status_from_deviation,
    feed_runway_days,
)
from app.analytics.finance import (
    cost_per_bird_paise,
    cost_per_kg_paise,
    profit_per_bird_paise,
    total_cost_paise,
)
from app.analytics.settlement import (
    SettlementInput,
    SettlementLine,
    SettlementResult,
    compute_settlement,
)

__all__ = [
    "age_in_days",
    "current_birds",
    "mortality_pct",
    "livability_pct",
    "average_weight_kg",
    "fcr",
    "deviation_pct",
    "status_from_deviation",
    "feed_runway_days",
    "cost_per_bird_paise",
    "cost_per_kg_paise",
    "profit_per_bird_paise",
    "total_cost_paise",
    "SettlementInput",
    "SettlementLine",
    "SettlementResult",
    "compute_settlement",
]
