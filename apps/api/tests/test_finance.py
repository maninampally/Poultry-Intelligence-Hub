"""Tests for finance calculations (integer paise)."""

import pytest

from app.analytics.finance import (
    cost_per_bird_paise,
    cost_per_kg_paise,
    profit_per_bird_paise,
    total_cost_paise,
)


def test_total_cost():
    assert total_cost_paise(
        feed_cost_paise=21000000,
        chick_cost_paise=5000000,
        medicine_cost_paise=1500000,
        labor_cost_paise=2000000,
        other_cost_paise=500000,
    ) == 30000000


def test_total_cost_negative_raises():
    with pytest.raises(ValueError):
        total_cost_paise(feed_cost_paise=-1)


def test_cost_per_bird():
    # 30,00,000 paise / 5000 birds = 600 paise = Rs 6.00
    assert cost_per_bird_paise(30000000, 5000) == 6000
    assert cost_per_bird_paise(100, 0) is None


def test_cost_per_bird_rounds_half_up():
    # 10001 paise / 2 = 5000.5 -> 5001
    assert cost_per_bird_paise(10001, 2) == 5001


def test_cost_per_kg():
    # 30,00,000 paise / 8000 kg = 3750 paise/kg (Rs 37.50)
    assert cost_per_kg_paise(30000000, 8000.0) == 3750
    assert cost_per_kg_paise(100, 0) is None


def test_profit_per_bird_positive():
    # (net 35,00,000 - cost 30,00,000) / 5000 = 1000 paise/bird (Rs 10)
    assert profit_per_bird_paise(35000000, 30000000, 5000) == 1000


def test_profit_per_bird_negative():
    # loss: (28,00,000 - 30,00,000) / 5000 = -400 paise/bird
    assert profit_per_bird_paise(28000000, 30000000, 5000) == -400


def test_profit_per_bird_no_birds():
    assert profit_per_bird_paise(1, 1, 0) is None
