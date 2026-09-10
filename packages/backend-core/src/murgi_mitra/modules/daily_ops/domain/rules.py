"""Pure mortality domain rules — no DB or network I/O."""


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
