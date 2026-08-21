from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentHub AI Marketplace & Orchestrator API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Zero-Fail Demo Switch: Deterministic fallback streaming proxy
    DEMO_MODE: bool = True
    
    # Security & Auth
    SECRET_KEY: str = "agenthub_super_secret_jwt_key_codefury_2026_x842"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./agenthub.db"
    
    # External APIs
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()