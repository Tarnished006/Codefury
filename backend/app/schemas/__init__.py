from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    handle: str = Field(..., min_length=2, max_length=50)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    handle: str
    role: str
    credits: float
    created_at: datetime

# --- Model Schemas ---
class AIModelBase(BaseModel):
    id: str
    name: str
    repo_id: str
    domain: str
    task_tag: str
    description: Optional[str] = None
    context_length: int
    parameters: str
    p50_latency_ms: int
    price_per_1k: float
    security_score: int
    is_online: bool

class AIModelResponse(AIModelBase):
    pass

class ModelInferenceRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    stream: bool = True

# --- Arena Schemas ---
class ArenaStreamRequest(BaseModel):
    prompt: str
    model_ids: List[str] = Field(..., min_length=2, max_length=3)

class ArenaVoteRequest(BaseModel):
    session_id: str
    winner_model_id: str
    notes: Optional[str] = None

# --- Orchestrator Schemas ---
class OrchestrateRequest(BaseModel):
    goal: str = Field(..., min_length=5, description="High-level natural language intent or multi-stage task")
    user_id: Optional[str] = None

class DAGStep(BaseModel):
    step_index: int
    title: str
    description: str
    assigned_model_id: str
    assigned_model_name: str
    status: str
    latency_ms: int
    output: Optional[str] = None

class OrchestrationResponse(BaseModel):
    job_id: str
    goal: str
    status: str
    dag_plan: List[DAGStep]
    final_output: str
    total_tokens: int
    execution_time_ms: int

# --- OWASP Audit Schemas ---
class OWASPAuditResponse(BaseModel):
    model_id: str
    overall_score: int
    prompt_injection_score: int
    jailbreak_resistance_score: int
    task_hijacking_score: int
    data_leakage_score: int
    context_manipulation_score: int
    audit_summary: str
    vulnerabilities: List[Dict[str, Any]]
    audited_at: datetime

# --- Sandbox / Deployment Schemas ---
class ExecuteSnippetRequest(BaseModel):
    language: str = "python"
    code: str
    model_id: str
    api_key: Optional[str] = None

class ExecuteSnippetResponse(BaseModel):
    status: str
    output: str
    execution_time_ms: int
    tokens_used: int
    cost_deducted: float

class CreateApiKeyRequest(BaseModel):
    name: str = "Live Production Key"

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    api_key: str
    created_at: datetime

# --- Wallet Schemas ---
class WalletResponse(BaseModel):
    user_id: str
    balance_credits: float
    total_spent: float
    updated_at: datetime

class TopupRequest(BaseModel):
    amount_credits: float = 100.0