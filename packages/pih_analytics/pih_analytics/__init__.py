"""Shared deterministic analytics for API and Celery worker."""

from pih_analytics.metrics import (
    age_in_days,
    average_weight_kg,
    current_birds,
    deviation_pct,
    fcr,
    feed_runway_days,
    livability_pct,
    mortality_pct,
    status_from_deviation,
)
from pih_analytics.finance import (
    cost_per_bird_paise,
    cost_per_kg_paise,
    profit_per_bird_paise,
    total_cost_paise,
)
from pih_analytics.settlement import (
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
