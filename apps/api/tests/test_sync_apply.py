"""Phase 1: sync payload helpers and cursor encoding."""

from __future__ import annotations

from datetime import datetime, timezone

from app.routers.sync import _decode_cursor, _encode_cursor
from app.sync_apply import normalize_payload


def test_normalize_payload_camel_and_snake() -> None:
    data = normalize_payload(
        {
            "flockId": "a",
            "recordDate": "2026-01-02",
            "feedKg": 1.5,
            "deaths": 2,
            "notes": "ok",
        }
    )
    assert data["flock_id"] == "a"
    assert data["record_date"] == "2026-01-02"
    assert data["feed_kg"] == 1.5
    assert data["deaths"] == 2
    assert normalize_payload({"flock_id": "b"})["flock_id"] == "b"


def test_cursor_roundtrip() -> None:
    ts = datetime(2026, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    rid = "11111111-1111-1111-1111-111111111111"
    encoded = _encode_cursor(ts, rid)
    got_ts, got_id = _decode_cursor(encoded)
    assert got_id == rid
    assert got_ts == ts


def test_legacy_cursor_since_only() -> None:
    import base64
    import json

    raw = base64.urlsafe_b64encode(
        json.dumps({"since": "2026-01-01T00:00:00+00:00"}).encode()
    ).decode()
    ts, rid = _decode_cursor(raw)
    assert ts.isoformat().startswith("2026-01-01")
    assert rid.startswith("00000000")


def test_empty_cursor() -> None:
    ts, rid = _decode_cursor(None)
    assert ts.timestamp() == 0
    assert rid.startswith("00000000")
