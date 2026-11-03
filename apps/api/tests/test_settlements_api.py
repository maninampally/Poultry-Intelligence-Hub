"""Phase 3: settlement request mapping + router registration.

Finance isolation for workers is covered by supabase/test/rls_test.sql
(scenarios S3/S4). These tests cover the deterministic compute path the
HTTP layer uses before persist.
"""

from __future__ import annotations

from app.main import create_app
from app.routers.settlements import SettlementComputeBody, _to_input
from pih_analytics.settlement import compute_settlement


def test_settlement_routes_registered() -> None:
    app = create_app()
    paths = {route.path for route in app.routes}
    assert "/api/v1/settlements/compute" in paths
    assert "/api/v1/settlements/flock/{flock_id}" in paths
    assert "/api/v1/expenses" in paths


def test_independent_compute_via_api_mapper() -> None:
    body = SettlementComputeBody(
        org_id="00000000-0000-0000-0000-000000000001",
        flock_id="00000000-0000-0000-0000-000000000002",
        kind="independent",
        birds_lifted=1000,
        avg_weight_kg=2.0,
        rate_paise_per_kg=12000,  # ₹120/kg
        adjustments_paise=-50000,
    )
    result = compute_settlement(_to_input(body))
    # 1000 * 2.0 * 12000 = 24_000_000 paise gross; minus 50_000
    assert result.total_paise == 24_000_000 - 50_000
    assert len(result.lines) == 2
    assert result.lines[0].label.startswith("Gross")


def test_contract_compute_via_api_mapper() -> None:
    body = SettlementComputeBody(
        org_id="00000000-0000-0000-0000-000000000001",
        flock_id="00000000-0000-0000-0000-000000000002",
        kind="contract",
        birds_lifted=100,
        base_charge_paise=2000,
        base_charge_basis="per_bird",
        fcr_value=1.5,
        rules=[
            {
                "metric": "fcr",
                "lower_bound": 1.4,
                "upper_bound": 1.6,
                "adjust_paise_per_bird": 100,
                "description": "FCR band bonus",
            }
        ],
    )
    result = compute_settlement(_to_input(body))
    assert result.total_paise == 2000 * 100 + 100 * 100
    assert any("FCR" in line.label for line in result.lines)
