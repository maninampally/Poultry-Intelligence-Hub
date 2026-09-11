"""HTTP routes for daily ops read models (mortality metrics)."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from murgi_mitra.core.auth import AuthContext, require_auth
from murgi_mitra.modules.daily_ops.application.service import get_batch_metrics

router = APIRouter(prefix="/v1/batches", tags=["batches"])


class BatchMetricsResponse(BaseModel):
    batch_id: UUID
    tenant_id: str
    placement_count: int
    cumulative_mortality: int
    live_bird_count: int
    mortality_percent: float
    last_processed_event_id: UUID | None = None
    projection_status: str


@router.get("/{batch_id}/metrics", response_model=BatchMetricsResponse)
def read_batch_metrics(
    batch_id: UUID,
    auth: AuthContext = Depends(require_auth),
) -> BatchMetricsResponse:
    """Return live-bird / cumulative mortality projection for one batch."""
    try:
        view = get_batch_metrics(batch_id, auth)
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        ) from error
    except LookupError as error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        ) from error

    return BatchMetricsResponse(
        batch_id=view.batch_id,
        tenant_id=view.tenant_id,
        placement_count=view.placement_count,
        cumulative_mortality=view.cumulative_mortality,
        live_bird_count=view.live_bird_count,
        mortality_percent=view.mortality_percent,
        last_processed_event_id=view.last_processed_event_id,
        projection_status=view.projection_status,
    )
