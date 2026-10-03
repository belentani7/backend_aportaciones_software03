from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Music Production Lab Commerce OS"
    environment: str = "development"
    database_url: str = "sqlite:///./data/commerce.db"
    redis_url: str = "redis://redis:6379/0"
    admin_email: str = "operator@local.lab"
    admin_password: str = "local-development-password"
    admin_access_token: str = "local-development-access-token"
    allowed_origins: str = "http://localhost:8080,http://127.0.0.1:8080"
    log_level: str = "INFO"
    data_dir: Path = Field(default=Path("/app/data"))

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
