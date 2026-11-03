"""Phase 0: JWT fail-closed outside local/dev/test."""

from __future__ import annotations

import pytest

from app.config import Settings


def test_local_allows_empty_jwt_secret() -> None:
    s = Settings(environment="local", jwt_secret="")
    assert s.allows_unverified_jwt is True
    s.validate_security()  # must not raise


def test_production_requires_jwt_secret() -> None:
    s = Settings(environment="production", jwt_secret="")
    assert s.allows_unverified_jwt is False
    with pytest.raises(RuntimeError, match="JWT_SECRET"):
        s.validate_security()


def test_production_ok_with_jwt_secret() -> None:
    s = Settings(
        environment="production",
        jwt_secret="test-secret",
        allowed_origins="https://app.example.com",
    )
    s.validate_security()
