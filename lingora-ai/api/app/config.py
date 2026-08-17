from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/v1"
    PROJECT_NAME: str = "Lingora AI API"
    VERSION: str = "1.0.0"
    MOCK_MODE: bool = True
    SUPABASE_URL: str = "https://oazmbpifslcpolkepyge.supabase.co"
    SUPABASE_JWKS_URL: Optional[str] = None
    SUPABASE_JWT_SECRET: str = "lingora-dev-jwt-secret-key-32chars-min"
    MODEL_DIR: str = ""

    @property
    def jwks_endpoint(self) -> str:
        if self.SUPABASE_JWKS_URL:
            return self.SUPABASE_JWKS_URL
        return f"{self.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
