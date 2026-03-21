from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── App ───────────────────────────────────────────
    APP_NAME: str = "TalentAI"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"

    # ── Database ──────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./talentai.db"

    # ── Security ──────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── AI ─────────────────────────────────────────────
    GEMINI_API_KEY: str = ""

    # ── File Upload ───────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOADS_DIR: str = "uploads"

    # ── Admin Restriction ─────────────────────────────
    ADMIN_EMAIL: str = ""  # Only this email can register/login as admin

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()