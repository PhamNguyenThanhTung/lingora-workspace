from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    API_V1_STR: str = "/v1"
    PROJECT_NAME: str = "Lingora AI API"
    VERSION: str = "1.0.0"
    MOCK_MODE: bool = True
    SUPABASE_JWT_SECRET: str = "lingora-dev-jwt-secret-key-32chars-min"
    MODEL_DIR: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
