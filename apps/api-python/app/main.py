"""FastAPI application entrypoint."""

from fastapi import FastAPI

from murgi_mitra.core.health import SERVICE_NAME, SERVICE_STATUS
from murgi_mitra.modules.sync.api import router as sync_router

app = FastAPI(title="Murgi Mitra API", version="0.1.0")
app.include_router(sync_router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    """Return service liveness information."""

    return {"service": SERVICE_NAME, "status": SERVICE_STATUS}
