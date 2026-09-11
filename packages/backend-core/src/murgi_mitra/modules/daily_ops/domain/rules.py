"""Pure mortality domain rules — no DB or network I/O."""

from __future__ import annotations

from typing import Any
from uuid import UUID

EVENT_TYPE_MORTALITY_LOGGED = "mortality.logged"


def validate_mortality_count(count: int) -> None:
    if count < 0:
        raise ValueError("Mortality count cannot be negative")


def validate_shift(shift: str) -> None:
    if not shift or not shift.strip():
        raise ValueError("Shift is required")


def live_bird_count(placement_count: int, cumulative_mortality: int) -> int:
    return max(placement_count - cumulative_mortality, 0)


def mortality_percent(placement_count: int, cumulative_mortality: int) -> float:
    if placement_count <= 0:
        raise ValueError("Placement count must be positive")
    return cumulative_mortality * 100 / placement_count


def validate_correction_target(
    *,
    original: dict[str, Any] | None,
    batch_id: UUID,
    tenant_id: str,
) -> None:
    """Ensure a correcting event points at a valid, same-scope mortality event."""
    if original is None:
        raise ValueError("original_event_not_found")
    if str(original.get("tenant_id")) != str(tenant_id):
        raise ValueError("original_event_tenant_mismatch")
    if original.get("batch_id") != batch_id:
        raise ValueError("original_event_batch_mismatch")
    if original.get("event_type") != EVENT_TYPE_MORTALITY_LOGGED:
        raise ValueError("original_event_not_mortality")
    if original.get("already_superseded"):
        raise ValueError("original_event_already_superseded")
