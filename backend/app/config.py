"""Application configuration loaded from environment variables / .env file."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Core
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "carpe diem"
    API_PREFIX: str = "/api"

    # Database
    DATABASE_URL: str = "sqlite:///./carpe_diem.db"

    # Security / JWT
    JWT_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS — comma-separated origins (parsed via the cors_origins property).
    # Stored as a plain string so pydantic-settings doesn't try to JSON-decode it.
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # OpenRouter (AI, Phase 3)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "anthropic/claude-3.5-sonnet"
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Supabase Storage (Phase 3)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "carpe-diem"

    # Google OAuth (Phase 4)
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:5173/auth/google/callback"

    # Misc
    FRONTEND_URL: str = "http://localhost:5173"
    REDIS_URL: str = ""

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def ai_enabled(self) -> bool:
        return bool(self.OPENROUTER_API_KEY)

    @property
    def supabase_enabled(self) -> bool:
        return bool(self.SUPABASE_URL and self.SUPABASE_SERVICE_KEY)

    @property
    def google_enabled(self) -> bool:
        return bool(self.GOOGLE_CLIENT_ID)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
