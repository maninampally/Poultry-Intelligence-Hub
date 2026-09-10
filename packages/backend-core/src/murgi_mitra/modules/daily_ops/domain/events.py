"""Mortality domain events."""

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

EVENT_TYPE_MORTALITY_LOGGED = "mortality.logged"
OUTBOX_TOPIC_MORTALITY_LOGGED = "mortality.logged"
RESOURCE_MORTALITY_ENTRY = "mortality-entry"


@dataclass(frozen=True)
class MortalityLogged:
    event_id: UUID
    batch_id: UUID
    shed_id: UUID
    count: int
    shift: str
    cause: str | None
    occurred_at: datetime
    supersedes_event_id: UUID | None = None

    def payload(self) -> dict:
        return {
            "batch_id": str(self.batch_id),
            "shed_id": str(self.shed_id),
            "count": self.count,
            "shift": self.shift,
            "cause": self.cause,
        }
