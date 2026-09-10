"""Sync HTTP routes — thin dispatch only.

Mortality → daily_ops (active modular path).
Feed / weight / finance → frozen legacy handlers until mortality gate passes.
"""

from fastapi import APIRouter, Depends, Query

from murgi_mitra.core.auth import AuthContext, require_auth
from murgi_mitra.modules.daily_ops.infrastructure.sync_handler import push_mortality

from .feed_service import push_feed_movement
from .performance_service import push_performance_or_finance
from .schemas import (
    ExpenseSyncOperation,
    FeedSyncOperation,
    MortalitySyncOperation,
    SaleSyncOperation,
    SyncEvent,
    SyncPullResponse,
    SyncPushRequest,
    SyncPushResponse,
    WeightSyncOperation,
)
from .service import pull_events

router = APIRouter(prefix="/v1/sync", tags=["sync"])


@router.post("/push", response_model=SyncPushResponse)
def push(request: SyncPushRequest, auth: AuthContext = Depends(require_auth)) -> SyncPushResponse:
    results = []
    for operation in request.changes:
        try:
            if isinstance(operation, MortalitySyncOperation):
                results.append(push_mortality(operation, auth))
            elif isinstance(operation, FeedSyncOperation):
                # Frozen until mortality MVP gate passes.
                results.append(push_feed_movement(operation, auth))
            elif isinstance(operation, (WeightSyncOperation, ExpenseSyncOperation, SaleSyncOperation)):
                # Frozen until mortality MVP gate passes.
                results.append(push_performance_or_finance(operation, auth))
            else:
                results.append(
                    {
                        "operation_id": getattr(operation, "operation_id", None),
                        "accepted": False,
                        "rejection_code": "unsupported_resource",
                    }
                )
        except ValueError as error:
            results.append(
                {
                    "operation_id": operation.operation_id,
                    "accepted": False,
                    "rejection_code": str(error),
                }
            )
    return SyncPushResponse(results=results)


@router.get("/pull", response_model=SyncPullResponse)
def pull(
    cursor: str | None = Query(default=None),
    auth: AuthContext = Depends(require_auth),
) -> SyncPullResponse:
    events, next_cursor = pull_events(cursor, auth)
    return SyncPullResponse(events=[SyncEvent.model_validate(event) for event in events], next_cursor=next_cursor)
