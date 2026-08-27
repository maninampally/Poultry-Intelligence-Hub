"""JWT authentication context for API command paths."""

from dataclasses import dataclass
import os

import jwt
from fastapi import Header, HTTPException, status

from .config import supabase_url
from .database import tenant_for_user


@dataclass(frozen=True)
class AuthContext:
    tenant_id: str
    user_id: str


def require_auth(authorization: str | None = Header(default=None)) -> AuthContext:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    try:
        token = authorization[7:]
        secret = os.getenv("JWT_SECRET")
        try:
            if not secret:
                raise jwt.PyJWTError("JWT_SECRET not configured")
            claims = jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
        except jwt.PyJWTError:
            jwks_client = jwt.PyJWKClient(f"{supabase_url()}/auth/v1/.well-known/jwks.json")
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(token, signing_key.key, algorithms=["RS256", "ES256"], audience="authenticated")
        user_id = str(claims["sub"])
        tenant_id = claims.get("tenant_id") or tenant_for_user(user_id)
        if not tenant_id:
            raise ValueError("User has no tenant membership")
    except (jwt.PyJWTError, KeyError, TypeError, ValueError, RuntimeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token")
    return AuthContext(tenant_id=str(tenant_id), user_id=str(user_id))
