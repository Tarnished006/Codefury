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

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), unique=True, nullable=False)
    balance_credits = Column(Float, default=500.0)  # Default 500 starting test credits
    total_spent = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="wallet")

class AIModel(Base):
    __tablename__ = "ai_models"
    
    id = Column(String(64), primary_key=True, index=True)  # e.g. "llama3", "deepseek-coder"
    name = Column(String(255), nullable=False)
    repo_id = Column(String(255), nullable=False)          # e.g. "meta-llama/Meta-Llama-3-8B-Instruct"
    domain = Column(String(64), index=True, nullable=False) # e.g. "LLM_CHAT", "CODE_GEN", "HEALTHCARE"
    task_tag = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    context_length = Column(Integer, default=8192)
    parameters = Column(String(32), default="8B")
    p50_latency_ms = Column(Integer, default=38)
    price_per_1k = Column(Float, default=0.12)
    security_score = Column(Integer, default=98)
    is_online = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    audits = relationship("OWASPAudit", back_populates="model", cascade="all, delete-orphan")
    deployments = relationship("Deployment", back_populates="model")

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
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="api_keys")

class OrchestrationJob(Base):
    __tablename__ = "orchestration_jobs"
    
    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    goal_prompt = Column(Text, nullable=False)
    status = Column(String(32), default="COMPLETED")
    dag_plan = Column(JSON, default=list)
    final_output = Column(Text, nullable=True)
    total_tokens = Column(Integer, default=0)
    execution_time_ms = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="orchestrations")