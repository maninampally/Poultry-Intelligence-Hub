"""JWT authentication dependency.

Verifies a Supabase-issued JWT from the Authorization header and exposes
the authenticated user's id (the `sub` claim == auth.uid()).

In local/dev, if no jwt_secret is configured we decode without signature
verification so the API can be exercised without a full Supabase setup.
Production MUST set JWT_SECRET.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from app.config import Settings, get_settings


@dataclass(frozen=True)
class AuthContext:
    user_id: str
    email: Optional[str] = None


def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return authorization.split(" ", 1)[1].strip()


async def get_auth(
    authorization: Optional[str] = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthContext:
    token = _extract_bearer(authorization)
    try:
        if settings.jwt_secret:
            claims = jwt.decode(
                token,
                settings.jwt_secret,
                algorithms=[settings.jwt_algorithm],
                audience=settings.jwt_audience,
            )
        else:
            # Dev fallback: no secret configured -> decode unverified.
            claims = jwt.get_unverified_claims(token)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject (sub) claim",
        )
    return AuthContext(user_id=user_id, email=claims.get("email"))
