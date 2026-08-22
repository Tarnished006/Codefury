from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    handle: str = Field(..., min_length=2, max_length=50)
    role: Optional[str] = "developer"

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
    creator_id: Optional[str] = None

# --- Creator & Marketplace Schemas ---
class CreatorBase(BaseModel):
    id: str
    name: str
    handle: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    total_earnings_credits: float
    pending_payout_credits: float

class CreatorResponse(CreatorBase):
    models_count: int = 0
    created_at: datetime

class PayoutRequest(BaseModel):
    creator_id: str
    amount_credits: float = Field(..., gt=0)
    payout_method: str = "stripe_connect" # "stripe_connect", "crypto_usdc"
    destination_address: str = Field(..., min_length=4)

class PayoutResponse(BaseModel):
    payout_id: str
    creator_id: str
    amount_credits: float
    amount_usd: float
    payout_method: str
    destination_address: str
    reference_id: str
    status: str
    remaining_balance_credits: float
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
    purchase_price: float = 100.0
    security_score: int
    is_online: bool
    creator_id: Optional[str] = None

class AIModelResponse(AIModelBase):
    creator_name: Optional[str] = None

class AIModelCreate(BaseModel):
    name: str
    repo_id: str
    domain: str
    task_tag: str
    description: Optional[str] = None
    context_length: int = 8192
    parameters: str = "8B"
    price_per_1k: float = 0.12
    purchase_price: float = 100.0

class AIModelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    domain: Optional[str] = None
    task_tag: Optional[str] = None
    context_length: Optional[int] = None
    parameters: Optional[str] = None
    price_per_1k: Optional[float] = None
    purchase_price: Optional[float] = None
    is_online: Optional[bool] = None

class ModelInferenceRequest(BaseModel):
    prompt: str
    user_id: Optional[str] = None
    max_tokens: Optional[int] = 512
    temperature: Optional[float] = 0.7
    stream: bool = True

# --- Arena Schemas ---
class ArenaStreamRequest(BaseModel):
    prompt: str
    model_ids: List[str] = Field(..., min_length=2, max_length=3)
    user_id: Optional[str] = None

class ArenaVoteRequest(BaseModel):
    session_id: str
    winner_model_id: str
    notes: Optional[str] = None

# --- Budget-Aware Orchestrator Schemas ---
class OrchestrateRequest(BaseModel):
    goal: str = Field(..., min_length=5, description="High-level natural language intent or multi-stage task")
    user_id: Optional[str] = None
    max_budget_credits: Optional[float] = None

class DAGStep(BaseModel):
    step_index: int
    title: str
    description: str
    assigned_model_id: str
    assigned_model_name: str
    status: str
    latency_ms: int
    cost_credits: float
    output: Optional[str] = None

class OrchestrationResponse(BaseModel):
    job_id: str
    goal: str
    budget_strategy: str
    balance_checked: float
    estimated_cost_credits: float
    status: str
    dag_plan: List[DAGStep]
    final_output: str
    total_tokens: int
    execution_time_ms: int

# --- OWASP Audit Schemas ---
class OWASPScores(BaseModel):
    prompt_injection: int = 92
    jailbreak_resistance: int = 88
    task_hijacking: int = 95
    data_leakage: int = 84
    context_manipulation: int = 90

class OWASPAuditResponse(BaseModel):
    model_id: str
    overall_score: int
    scores: OWASPScores
    status: str = "verified"
    prompt_injection_score: int
    jailbreak_resistance_score: int
    task_hijacking_score: int
    data_leakage_score: int
    context_manipulation_score: int
    audit_summary: str
    vulnerabilities: List[Dict[str, Any]]
    audited_at: datetime
    # Enriched live audit fields
    reasoning: Optional[str] = None
    probe_outputs: Optional[List[Dict[str, Any]]] = None
    evaluated_by: Optional[str] = None
    repo_id: Optional[str] = None
    execution_logs: Optional[List[str]] = None
    raw_judge_output: Optional[str] = None
    audit_duration_ms: Optional[int] = None

# --- Sandbox / Deployment Schemas ---
class ExecuteSnippetRequest(BaseModel):
    language: str = "python"
    code: str
    model_id: str
    api_key: Optional[str] = None

class ExecuteSnippetResponse(BaseModel):
    status: str = "SUCCESS"
    output: str
    execution_time_ms: int
    tokens_used: int
    cost_deducted: float = 0.0
    exit_code: Optional[int] = 0
    session_id: Optional[str] = None
    model_tested: Optional[str] = None

class CreateApiKeyRequest(BaseModel):
    name: str = "Live Production Key"

class ApiKeyResponse(BaseModel):
    id: str
    name: str
    api_key: str
    created_at: datetime

# --- Double-Entry Ledger & Wallet Schemas ---
class WalletResponse(BaseModel):
    user_id: str
    balance_credits: float
    total_spent: float
    updated_at: datetime

class TopupRequest(BaseModel):
    amount_credits: float = 100.0

class CheckoutRequest(BaseModel):
    user_id: str
    credits_package: int = 500
    payment_method: str = "stripe"
    card_last4: Optional[str] = "4242"

class CheckoutResponse(BaseModel):
    transaction_id: str
    user_id: str
    credits_added: int
    amount_usd: float
    new_balance_credits: float
    status: str
    checkout_url: Optional[str] = None
    created_at: datetime

class LedgerTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    user_id: Optional[str] = None
    model_id: Optional[str] = None
    creator_id: Optional[str] = None
    tokens_metered: int
    cost_credits: float
    creator_royalty_credits: float
    platform_fee_credits: float
    description: Optional[str] = None
    created_at: datetime

# --- Purchased & Tested Models and User Profile Details ---
class PurchasedModelResponse(BaseModel):
    id: str
    model_id: str
    model_name: str
    price_paid: float
    purchased_at: datetime

class TestedModelResponse(BaseModel):
    id: str
    model_id: str
    model_name: str
    tested_at: datetime
    test_details: Optional[str] = None

class UserUpdate(BaseModel):
    handle: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None

class UserProfileDetailsResponse(BaseModel):
    id: str
    email: str
    handle: str
    role: str
    created_at: datetime
    balance_credits: float
    total_spent: float
    total_tokens_used: int
    api_keys: List[ApiKeyResponse]
    purchased_models: List[PurchasedModelResponse]
    tested_models: List[TestedModelResponse]
    ecommerce_history: List[LedgerTransactionResponse]
    creator_id: Optional[str] = None

# --- Creator Profile & Wallet Schemas ---
class CreatorProfileResponse(BaseModel):
    id: str
    name: str
    handle: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    total_earnings_credits: float
    pending_payout_credits: float
    pending_payout_usd: float
    lifetime_earnings_usd: float
    models_count: int
    payout_status: str
    revenue_split_percent: str
    created_at: datetime

class CreatorTransactionResponse(BaseModel):
    id: str
    transaction_type: str
    model_id: Optional[str] = None
    model_name: Optional[str] = None
    tokens_metered: int
    cost_credits: float
    creator_royalty_credits: float
    description: Optional[str] = None
    created_at: datetime