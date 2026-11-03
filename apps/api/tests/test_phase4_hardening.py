"""Phase 4: CORS fail-closed, health routes, serialize helpers."""

from __future__ import annotations

from datetime import date, datetime, timezone
from decimal import Decimal
from uuid import UUID

import pytest

from app.config import Settings
from app.main import create_app
from app.serialize import jsonable, row_dict


def test_production_rejects_wildcard_cors() -> None:
    s = Settings(
        environment="production",
        jwt_secret="secret",
        allowed_origins="*",
    )
    with pytest.raises(RuntimeError, match="ALLOWED_ORIGINS"):
        s.validate_security()


def test_production_ok_with_explicit_cors() -> None:
    s = Settings(
        environment="production",
        jwt_secret="secret",
        allowed_origins="https://app.example.com",
    )
    s.validate_security()


def test_health_routes_registered() -> None:
    app = create_app()
    paths = {route.path for route in app.routes}
    assert "/health/live" in paths
    assert "/health/ready" in paths
    assert "/health" in paths


def test_jsonable_uuid_date_decimal() -> None:
    uid = UUID("11111111-1111-1111-1111-111111111111")
    payload = jsonable(
        {
            "id": uid,
            "on": date(2026, 1, 2),
            "at": datetime(2026, 1, 2, tzinfo=timezone.utc),
            "amt": Decimal("1.50"),
        }
    )
    assert payload["id"] == str(uid)
    assert payload["on"] == "2026-01-02"
    assert payload["at"].startswith("2026-01-02")
    assert payload["amt"] == 1.5


def test_row_dict_handles_mapping() -> None:
    class FakeRow(dict):
        pass

    row = FakeRow(id=UUID("22222222-2222-2222-2222-222222222222"))
    assert row_dict(row)["id"] == "22222222-2222-2222-2222-222222222222"
