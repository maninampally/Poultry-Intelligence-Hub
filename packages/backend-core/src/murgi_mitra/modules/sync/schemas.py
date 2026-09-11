"""Sync HTTP contracts."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class MortalitySyncOperation(BaseModel):
    operation_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=255)
    resource: Literal["mortality-entry"]
    action: Literal["create"]
    entity_id: UUID
    batch_id: UUID
    shed_id: UUID
    base_version: int | None = None
    occurred_at: datetime
    count: int = Field(ge=0)
    shift: str = Field(min_length=1, max_length=32)
    cause: str | None = None
    supersedes_event_id: UUID | None = None


class FeedSyncOperation(BaseModel):
    operation_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=255)
    resource: Literal["feed-movement"]
    action: Literal["create"]
    entity_id: UUID
    farm_id: UUID
    product_id: UUID
    lot_id: UUID | None = None
    movement_type: Literal["receipt", "usage", "wastage"]
    quantity_kg: float = Field(gt=0)
    batch_id: UUID | None = None
    shed_id: UUID | None = None
    occurred_at: datetime


class WeightSyncOperation(BaseModel):
    operation_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=255)
    resource: Literal["weight-sample"]
    action: Literal["create"]
    entity_id: UUID
    batch_id: UUID
    shed_id: UUID
    sample_size: int = Field(gt=0)
    total_weight_kg: float = Field(ge=0)
    average_weight_kg: float = Field(ge=0)
    occurred_at: datetime


class ExpenseSyncOperation(BaseModel):
    operation_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=255)
    resource: Literal["expense-entry"]
    action: Literal["create"]
    entity_id: UUID
    farm_id: UUID
    batch_id: UUID | None = None
    category: str = Field(min_length=1, max_length=64)
    amount: float = Field(ge=0)
    occurred_at: datetime


class SaleSyncOperation(BaseModel):
    operation_id: UUID
    idempotency_key: str = Field(min_length=1, max_length=255)
    resource: Literal["sale-record"]
    action: Literal["create"]
    entity_id: UUID
    farm_id: UUID
    batch_id: UUID | None = None
    birds_sold: int = Field(gt=0)
    total_weight_kg: float = Field(gt=0)
    price_per_kg: float = Field(ge=0)
    buyer: str | None = None
    occurred_at: datetime


SyncOperation = (
    MortalitySyncOperation
    | FeedSyncOperation
    | WeightSyncOperation
    | ExpenseSyncOperation
    | SaleSyncOperation
)


class SyncPushRequest(BaseModel):
    changes: list[SyncOperation] = Field(min_length=1, max_length=100)


class SyncPushResult(BaseModel):
    operation_id: UUID
    accepted: bool
    event_id: UUID | None = None
    duplicate: bool = False
    rejection_code: str | None = None


class SyncPushResponse(BaseModel):
    results: list[SyncPushResult]


class SyncEvent(BaseModel):
    event_id: UUID
    event_type: str
    batch_id: UUID | None
    occurred_at: datetime
    payload: dict[str, Any]
    supersedes_event_id: UUID | None = None


class SyncPullResponse(BaseModel):
    events: list[SyncEvent]
    next_cursor: str | None
