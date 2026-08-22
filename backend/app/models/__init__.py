import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    handle = Column(String(100), unique=True, index=True, nullable=False)
    role = Column(String(50), default="developer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    wallet = relationship("Wallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="user")
    api_keys = relationship("ApiKey", back_populates="user")
    orchestrations = relationship("OrchestrationJob", back_populates="user")
    transactions = relationship("LedgerTransaction", back_populates="user")
    purchased_models = relationship("PurchasedModel", back_populates="user", cascade="all, delete-orphan")
    tested_models = relationship("TestedModel", back_populates="user", cascade="all, delete-orphan")
    creator = relationship("Creator", back_populates="user", uselist=False, cascade="all, delete-orphan")
    registered_endpoints = relationship("RegisteredEndpoint", back_populates="developer", cascade="all, delete-orphan")

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    balance_credits = Column(Float, default=500.0)  # Default 500 starting test credits
    total_spent = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="wallet")

class Creator(Base):
    __tablename__ = "creators"
    
    id = Column(String(64), primary_key=True, index=True) # e.g. "creator_meta", "creator_deepseek"
    name = Column(String(255), nullable=False)
    handle = Column(String(100), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(512), nullable=True)
    total_earnings_credits = Column(Float, default=0.0)
    pending_payout_credits = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=True)
    
    user = relationship("User", back_populates="creator")
    models = relationship("AIModel", back_populates="creator")
    payouts = relationship("CreatorPayout", back_populates="creator")
    transactions = relationship("LedgerTransaction", back_populates="creator")

class AIModel(Base):
    __tablename__ = "ai_models"
    
    id = Column(String(64), primary_key=True, index=True)
    creator_id = Column(String(64), ForeignKey("creators.id"), nullable=True)
    name = Column(String(255), nullable=False)
    repo_id = Column(String(255), nullable=False)
    domain = Column(String(64), index=True, nullable=False)
    task_tag = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    context_length = Column(Integer, default=8192)
    parameters = Column(String(32), default="8B")
    p50_latency_ms = Column(Integer, default=38)
    price_per_1k = Column(Float, default=0.12)
    purchase_price = Column(Float, default=100.0)
    security_score = Column(Integer, default=98)
    is_online = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    creator = relationship("Creator", back_populates="models")
    audits = relationship("OWASPAudit", back_populates="model", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="model")
    transactions = relationship("LedgerTransaction", back_populates="model")

class RegisteredEndpoint(Base):
    """
    API Registry Pattern:
    Stores developer-registered external model endpoints (Hugging Face Inference endpoints,
    custom cloud URLs, AWS/RunPod endpoints, or Ollama/OpenAI-compatible endpoints).
    AgentHub acts as an intelligent routing gateway, telemetry tracker, and metering layer.
    """
    __tablename__ = "registered_endpoints"
    
    id = Column(String(36), primary_key=True, index=True)
    developer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_name = Column(String(255), nullable=False)
    domain = Column(String(64), index=True, default="LLM CHAT")
    task_tag = Column(String(100), default="Generative AI")
    api_endpoint = Column(String(512), nullable=False)
    api_key_env_or_secret = Column(String(512), nullable=True)
    price_per_1k_tokens = Column(Float, default=0.10)
    p50_latency_ms = Column(Integer, default=45)
    context_length = Column(Integer, default=8192)
    is_active = Column(Boolean, default=True)
    total_requests = Column(Integer, default=0)
    total_tokens_metered = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    developer = relationship("User", back_populates="registered_endpoints")

class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"
    
    id = Column(String(36), primary_key=True, index=True)
    transaction_type = Column(String(32), nullable=False) # "INFERENCE_METERING", "WALLET_TOPUP", "CREATOR_PAYOUT", "PROXY_INFERENCE"
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    model_id = Column(String(64), ForeignKey("ai_models.id"), nullable=True)
    creator_id = Column(String(64), ForeignKey("creators.id"), nullable=True)
    tokens_metered = Column(Integer, default=0)
    cost_credits = Column(Float, default=0.0)
    creator_royalty_credits = Column(Float, default=0.0) # 80% revenue split
    platform_fee_credits = Column(Float, default=0.0)    # 20% platform revenue
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="transactions")
    model = relationship("AIModel", back_populates="transactions")
    creator = relationship("Creator", back_populates="transactions")

class CreatorPayout(Base):
    __tablename__ = "creator_payouts"
    
    id = Column(String(36), primary_key=True, index=True)
    creator_id = Column(String(64), ForeignKey("creators.id"), nullable=False)
    amount_credits = Column(Float, nullable=False)
    amount_usd = Column(Float, nullable=False) # 1 Credit = $0.01 USD
    payout_method = Column(String(32), default="stripe_connect") # "stripe_connect", "crypto_usdc"
    destination_address = Column(String(255), nullable=False)
    reference_id = Column(String(64), nullable=False)
    status = Column(String(32), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    creator = relationship("Creator", back_populates="payouts")

class OWASPAudit(Base):
    __tablename__ = "owasp_audits"
    
    id = Column(String(36), primary_key=True, index=True)
    model_id = Column(String(64), ForeignKey("ai_models.id"), nullable=False)
    overall_score = Column(Integer, default=98)
    prompt_injection_score = Column(Integer, default=98)
    jailbreak_resistance_score = Column(Integer, default=96)
    task_hijacking_score = Column(Integer, default=99)
    data_leakage_score = Column(Integer, default=97)
    context_manipulation_score = Column(Integer, default=95)
    audit_summary = Column(Text, nullable=True)
    vulnerabilities = Column(JSON, default=list)
    audited_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    model = relationship("AIModel", back_populates="audits")

class Deployment(Base):
    __tablename__ = "deployments"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_id = Column(String(64), ForeignKey("ai_models.id"), nullable=False)
    endpoint_url = Column(String(512), nullable=False)
    status = Column(String(32), default="ACTIVE")
    requests_total = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="deployments")
    model = relationship("AIModel", back_populates="deployments")

class ApiKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    name = Column(String(100), default="Default Key")
    key_prefix = Column(String(16), nullable=False)
    hashed_key = Column(String(255), nullable=False)
    credits_balance = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")

class OrchestrationJob(Base):
    __tablename__ = "orchestration_jobs"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    goal_prompt = Column(Text, nullable=False)
    budget_strategy = Column(String(64), default="HIGH_PERFORMANCE_PREMIUM")
    status = Column(String(32), default="COMPLETED")
    dag_plan = Column(JSON, default=list)
    final_output = Column(Text, nullable=True)
    total_tokens = Column(Integer, default=0)
    estimated_cost_credits = Column(Float, default=0.0)
    execution_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="orchestrations")

class PurchasedModel(Base):
    __tablename__ = "purchased_models"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_id = Column(String(64), ForeignKey("ai_models.id"), nullable=False)
    price_paid = Column(Float, default=0.0)
    purchased_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="purchased_models")
    model = relationship("AIModel")

class TestedModel(Base):
    __tablename__ = "tested_models"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    model_id = Column(String(64), ForeignKey("ai_models.id"), nullable=False)
    tested_at = Column(DateTime, default=datetime.datetime.utcnow)
    test_details = Column(String(255), nullable=True)
    
    user = relationship("User", back_populates="tested_models")
    model = relationship("AIModel")