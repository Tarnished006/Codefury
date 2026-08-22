import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Determine absolute project root
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

# Pre-load .env files from project root and backend dir
_env_files = [
    _PROJECT_ROOT / ".env",
    _PROJECT_ROOT / ".env.local",
    _BACKEND_DIR / ".env",
    Path.cwd() / ".env",
]
for ef in _env_files:
    if ef.exists() and ef.is_file():
        load_dotenv(dotenv_path=str(ef), override=False)

_db_str = str((_PROJECT_ROOT / "agenthub.db").resolve()).replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "AgentHub AI Marketplace & Orchestrator API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api"
    
    # Execution mode: False = Live real APIs, True = Fallback deterministic simulation
    DEMO_MODE: bool = False
    
    # Security & Auth
    SECRET_KEY: str = "agenthub_super_secret_jwt_key_codefury_2026_x842"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{_db_str}"
    
    # Hugging Face API Credentials
    HF_TOKEN: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # Groq API Credentials
    GROQ_API_KEY: Optional[str] = None
    
    # Stripe Payment Credentials
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_SUCCESS_URL: str = "http://localhost:3000/wallet?status=success&session_id={CHECKOUT_SESSION_ID}"
    STRIPE_CANCEL_URL: str = "http://localhost:3000/wallet?status=cancelled"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=[str(f) for f in _env_files if f.exists()],
        extra="ignore"
    )

    @property
    def hf_api_token(self) -> Optional[str]:
        return self.HF_TOKEN or self.HUGGINGFACE_API_KEY

settings = Settings()