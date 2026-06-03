# app/core/config.py
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Factoring MVP"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    SECRET_KEY: str = "dev-secret-key-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # SUPABASE CONFIG
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    SEPAY_API_URL: str = ""
    SEPAY_ACCESS_TOKEN: str = ""
    VIETQR_API_URL: str = ""
    VIETQR_CLIENT_ID: str = ""
    VIETQR_API_KEY: str = ""

    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = "dev@example.com"
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "localhost"

    SEPAY_WEBHOOK_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_API_KEY: str = ""
    LLM_MODEL: str = ""
    # AI (Gemini)
    GEMINI_API_KEY: str = ""
    UPLOAD_DIR: str = "storage/uploads"

    @field_validator("DATABASE_URL")
    def assemble_db_connection(cls, v: str) -> str:
        if v and v.startswith("postgresql://") and "+asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
