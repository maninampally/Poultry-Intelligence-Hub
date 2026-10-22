"""Tests for the settlement calculator."""

from app.analytics.settlement import (
    AgreementRule,
    SettlementInput,
    compute_settlement,
)


def test_independent_basic():
    # 4820 birds @ 1.82 kg avg = 8772.4 kg; rate 8500 paise/kg (Rs 85/kg)
    data = SettlementInput(
        kind="independent",
        birds_lifted=4820,
        avg_weight_kg=1.82,
        rate_paise_per_kg=8500,
    )
    result = compute_settlement(data)
    expected_gross = round(8772.4 * 8500)  # 74,565,400 paise
    assert result.total_paise == expected_gross
    assert result.lines[0].label == "Gross (weight x rate)"


def test_independent_with_adjustments():
    data = SettlementInput(
        kind="independent",
        birds_lifted=1000,
        total_weight_kg=2000.0,
        rate_paise_per_kg=9000,
        adjustments_paise=-50000,  # Rs 500 deduction
    )
    result = compute_settlement(data)
    # gross 2000*9000 = 18,000,000; minus 50,000 = 17,950,000
    assert result.total_paise == 17950000
    assert len(result.lines) == 2


def test_contract_base_per_bird_no_rules():
    data = SettlementInput(
        kind="contract",
        birds_lifted=5000,
        base_charge_paise=700,  # Rs 7/bird
        base_charge_basis="per_bird",
    )
    result = compute_settlement(data)
    assert result.total_paise == 3500000  # 5000 * 700
    assert len(result.lines) == 1


def test_contract_with_fcr_bonus():
    # FCR 1.55 falls in [0, 1.60) band -> +50 paise/bird bonus
    rules = [
        AgreementRule(
            metric="fcr",
            lower_bound=None,
            upper_bound=1.60,
            adjust_paise_per_bird=50,
            description="FCR bonus (<1.60)",
        ),
        AgreementRule(
            metric="fcr",
            lower_bound=1.80,
            upper_bound=None,
            adjust_paise_per_bird=-40,
            description="FCR penalty (>=1.80)",
        ),
    ]
    data = SettlementInput(
        kind="contract",
        birds_lifted=5000,
        base_charge_paise=700,
        base_charge_basis="per_bird",
        fcr_value=1.55,
        rules=rules,
    )
    result = compute_settlement(data)
    # base 35,00,000 + bonus (50*5000=2,50,000) = 37,50,000
    assert result.total_paise == 3750000
    labels = [l.label for l in result.lines]
    assert "FCR bonus (<1.60)" in labels
    assert "FCR penalty (>=1.80)" not in labels  # 1.55 not in penalty band


def test_contract_mortality_penalty():
    rules = [
        AgreementRule(
            metric="mortality_pct",
            lower_bound=5.0,
            upper_bound=None,
            adjust_paise_per_bird=-30,
            description="High mortality penalty",
        ),
    ]
    data = SettlementInput(
        kind="contract",
        birds_lifted=4000,
        base_charge_paise=700,
        mortality_pct_value=6.2,
        rules=rules,
    )
    result = compute_settlement(data)
    # base 28,00,000 - penalty (30*4000=1,20,000) = 26,80,000
    assert result.total_paise == 2680000
