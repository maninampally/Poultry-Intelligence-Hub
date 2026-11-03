"""Settlement calculator — deterministic, step-by-step, integer paise.

Two agreement kinds (Production Direction §33, BUILD_GUIDE Phase 6):

  independent: birds x avg_weight x rate_per_kg  minus adjustments
  contract:    base growing charge +/- FCR & mortality bonus/penalty bands

Every result carries an itemized list of SettlementLine so the farmer can
check the working line by line (BUILD_GUIDE Phase 6 requirement).

PLACEHOLDER: real contract incentive bands come from DECISIONS.md. The
band-matching logic here is structural; callers supply the real rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Literal, Optional

AgreementKind = Literal["independent", "contract"]
FcrFormula = Literal["feed_div_liveweight", "feed_div_gain"]


@dataclass(frozen=True)
class AgreementRule:
    """A single bonus/penalty band for a contract settlement."""

    metric: Literal["fcr", "mortality_pct", "avg_weight"]
    lower_bound: Optional[float]
    upper_bound: Optional[float]
    adjust_paise_per_bird: int
    description: str = ""

    def matches(self, value: Optional[float]) -> bool:
        if value is None:
            return False
        if self.lower_bound is not None and value < self.lower_bound:
            return False
        if self.upper_bound is not None and value >= self.upper_bound:
            return False
        return True


@dataclass(frozen=True)
class SettlementInput:
    kind: AgreementKind
    birds_lifted: int
    avg_weight_kg: float = 0.0
    total_weight_kg: Optional[float] = None
    # independent
    rate_paise_per_kg: int = 0
    adjustments_paise: int = 0
    # contract
    base_charge_paise: int = 0
    base_charge_basis: Literal["per_bird", "per_kg_live"] = "per_bird"
    fcr_value: Optional[float] = None
    mortality_pct_value: Optional[float] = None
    rules: List[AgreementRule] = field(default_factory=list)


@dataclass(frozen=True)
class SettlementLine:
    label: str
    amount_paise: int  # signed; negative = deduction
    detail: str = ""


@dataclass(frozen=True)
class SettlementResult:
    total_paise: int
    lines: List[SettlementLine]


def _effective_weight(data: SettlementInput) -> float:
    if data.total_weight_kg is not None:
        return data.total_weight_kg
    return data.birds_lifted * data.avg_weight_kg


def compute_settlement(data: SettlementInput) -> SettlementResult:
    """Compute a settlement amount in paise with itemized lines."""
    if data.birds_lifted < 0:
        raise ValueError("birds_lifted must be non-negative")

    if data.kind == "independent":
        return _independent(data)
    if data.kind == "contract":
        return _contract(data)
    raise ValueError(f"unknown agreement kind: {data.kind}")


def _independent(data: SettlementInput) -> SettlementResult:
    lines: List[SettlementLine] = []
    weight = _effective_weight(data)
    # gross = weight(kg) * rate(paise/kg); round half up to paise.
    gross = int(round(weight * data.rate_paise_per_kg))
    lines.append(
        SettlementLine(
            label="Gross (weight x rate)",
            amount_paise=gross,
            detail=f"{weight:.3f} kg x {data.rate_paise_per_kg} paise/kg",
        )
    )
    if data.adjustments_paise:
        lines.append(
            SettlementLine(
                label="Adjustments",
                amount_paise=data.adjustments_paise,
                detail="buyer adjustments (signed)",
            )
        )
    total = sum(l.amount_paise for l in lines)
    return SettlementResult(total_paise=total, lines=lines)


def _contract(data: SettlementInput) -> SettlementResult:
    lines: List[SettlementLine] = []
    # Base growing charge.
    if data.base_charge_basis == "per_bird":
        base = data.base_charge_paise * data.birds_lifted
        base_detail = f"{data.base_charge_paise} paise/bird x {data.birds_lifted} birds"
    else:  # per_kg_live
        weight = _effective_weight(data)
        base = int(round(weight * data.base_charge_paise))
        base_detail = f"{data.base_charge_paise} paise/kg x {weight:.3f} kg"
    lines.append(
        SettlementLine(label="Base growing charge", amount_paise=base, detail=base_detail)
    )

    # Apply each matching rule (FCR / mortality / weight bands).
    metric_values = {
        "fcr": data.fcr_value,
        "mortality_pct": data.mortality_pct_value,
        "avg_weight": data.avg_weight_kg,
    }
    for rule in data.rules:
        value = metric_values.get(rule.metric)
        if rule.matches(value):
            amount = rule.adjust_paise_per_bird * data.birds_lifted
            if amount != 0:
                sign = "bonus" if amount > 0 else "penalty"
                lines.append(
                    SettlementLine(
                        label=rule.description or f"{rule.metric} {sign}",
                        amount_paise=amount,
                        detail=(
                            f"{rule.adjust_paise_per_bird} paise/bird x "
                            f"{data.birds_lifted} birds ({rule.metric}={value})"
                        ),
                    )
                )

    total = sum(l.amount_paise for l in lines)
    return SettlementResult(total_paise=total, lines=lines)
