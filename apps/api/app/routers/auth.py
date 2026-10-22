"""Auth-scoped endpoints: bootstrap an org on first login, current user."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app import db
from app.auth import AuthContext, get_auth

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


class BootstrapRequest(BaseModel):
    org_name: str = Field(min_length=1)
    farm_name: str | None = None
    location: str | None = None


class BootstrapResponse(BaseModel):
    org_id: str
    farm_id: str | None = None


@router.post("/bootstrap", response_model=BootstrapResponse)
async def bootstrap(
    body: BootstrapRequest, auth: AuthContext = Depends(get_auth)
) -> BootstrapResponse:
    """Create org + owner membership + first farm for the caller."""
    async with db.acquire(auth.user_id) as conn:
        # Ensure a profile row exists for this auth user.
        await conn.execute(
            """
            insert into profiles (id, email)
            values ($1, $2)
            on conflict (id) do nothing
            """,
            auth.user_id,
            auth.email,
        )
        row = await conn.fetchrow(
            "select * from app_bootstrap_org($1, $2, $3)",
            body.org_name,
            body.farm_name,
            body.location,
        )
    return BootstrapResponse(
        org_id=str(row["org_id"]),
        farm_id=str(row["farm_id"]) if row["farm_id"] else None,
    )


@router.get("/me")
async def me(auth: AuthContext = Depends(get_auth)) -> dict:
    async with db.acquire(auth.user_id) as conn:
        memberships = await conn.fetch(
            """
            select org_id, role
            from organization_memberships
            where user_id = $1
            """,
            auth.user_id,
        )
    return {
        "user_id": auth.user_id,
        "email": auth.email,
        "memberships": [
            {"org_id": str(m["org_id"]), "role": m["role"]} for m in memberships
        ],
    }
