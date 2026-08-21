from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

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
    DATABASE_URL: str = "sqlite+aiosqlite:///./agenthub.db"
    
    # Hugging Face API Credentials (loaded exclusively from environment variables)
    HF_TOKEN: Optional[str] = None
    HUGGINGFACE_API_KEY: Optional[str] = None
    
    # Stripe Payment Credentials (loaded exclusively from environment variables)
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_SUCCESS_URL: str = "http://localhost:3000/wallet?status=success&session_id={CHECKOUT_SESSION_ID}"
    STRIPE_CANCEL_URL: str = "http://localhost:3000/wallet?status=cancelled"
    
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=(".env", ".env.local"),
        extra="ignore"
    )

    @property
    def hf_api_token(self) -> Optional[str]:
        return self.HF_TOKEN or self.HUGGINGFACE_API_KEY

settings = Settings()