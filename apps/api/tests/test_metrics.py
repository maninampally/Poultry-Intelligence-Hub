"""Tests for deterministic flock metrics."""

from datetime import date

import pytest

from app.analytics.metrics import (
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


def test_age_in_days():
    assert age_in_days(date(2026, 8, 1), date(2026, 8, 1)) == 0
    assert age_in_days(date(2026, 8, 1), date(2026, 9, 6)) == 36


def test_age_in_days_future_placement_raises():
    with pytest.raises(ValueError):
        age_in_days(date(2026, 8, 2), date(2026, 8, 1))


def test_current_birds():
    assert current_birds(5000, 180) == 4820
    assert current_birds(100, 200) == 0  # floored at 0


def test_current_birds_negative_raises():
    with pytest.raises(ValueError):
        current_birds(-1, 0)


def test_mortality_pct():
    assert mortality_pct(180, 5000) == pytest.approx(3.6)
    assert mortality_pct(0, 5000) == 0.0
    assert mortality_pct(5, 0) is None  # no birds placed


def test_livability_pct():
    assert livability_pct(4820, 5000) == pytest.approx(96.4)
    assert livability_pct(10, 0) is None


def test_average_weight():
    assert average_weight_kg(8772.4, 4820) == pytest.approx(1.82, abs=1e-3)
    assert average_weight_kg(100.0, 0) is None


def test_fcr():
    # 7600 kg feed / 4800 kg gain = 1.5833...
    assert fcr(7600.0, 4800.0) == pytest.approx(1.5833, abs=1e-4)
    assert fcr(100.0, 0.0) is None  # no gain yet


def test_deviation_pct():
    assert deviation_pct(1240, 1190) == pytest.approx(4.2016, abs=1e-3)
    assert deviation_pct(100, 0) is None


def test_status_from_deviation():
    assert status_from_deviation(2.0, watch_at=5, act_at=10) == "normal"
    assert status_from_deviation(6.0, watch_at=5, act_at=10) == "watch"
    assert status_from_deviation(-11.0, watch_at=5, act_at=10) == "act"
    assert status_from_deviation(None, watch_at=5, act_at=10) == "normal"


def test_feed_runway_days():
    assert feed_runway_days(600.0, [100, 110, 90]) == 6  # avg 100 -> 6 days
    assert feed_runway_days(600.0, []) is None
    assert feed_runway_days(600.0, [0, 0]) is None
