"""Application configuration, loaded from environment (.env)."""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Postgres (Supabase connection string). Example:
    #   postgresql://postgres:pih@localhost:55432/pih
    database_url: str = Field(default="postgresql://postgres:pih@localhost:55432/pih")

    # Supabase JWT secret used to verify Authorization: Bearer <jwt>.
    # In local/dev we allow an unverified decode when this is empty.
    jwt_secret: str = Field(default="")
    jwt_algorithm: str = Field(default="HS256")
    jwt_audience: str = Field(default="authenticated")

    # CORS
    allowed_origins: str = Field(default="*")

    # Connection pool sizing
    db_pool_min: int = Field(default=1)
    db_pool_max: int = Field(default=10)

    environment: str = Field(default="local")

    @property
    def cors_origins(self) -> list[str]:
        if self.allowed_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
