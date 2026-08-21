import asyncio
import uuid
import hashlib
import datetime
from app.database import AsyncSessionLocal, engine, Base
from app.models import AIModel, OWASPAudit, User, Wallet

def hash_password(password: str) -> str:
    salt = "agenthub_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

INITIAL_MODELS = [
    {
        "id": "llama3",
        "name": "Llama 3 8B Instruct",
        "repo_id": "meta-llama/Meta-Llama-3-8B-Instruct",
        "domain": "LLM_CHAT",
        "task_tag": "Text Generation",
        "description": "Meta state-of-the-art open weight 8B instruction tuned LLM.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 38,
        "price_per_1k": 0.12,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "deepseek",
        "name": "DeepSeek Coder 6.7B",
        "repo_id": "deepseek-ai/deepseek-coder-6.7b-instruct",
        "domain": "CODE_GEN",
        "task_tag": "Code Synthesis",
        "description": "Specialized code intelligence and multi-language synthesis model.",
        "context_length": 16384,
        "parameters": "6.7B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.08,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "biomedlm",
        "name": "BioMistral 7B Medical",
        "repo_id": "BioMistral/BioMistral-7B",
        "domain": "HEALTHCARE",
        "task_tag": "Clinical Reasoning",
        "description": "Domain-adapted medical foundation model trained on PubMed Central.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 48,
        "price_per_1k": 0.18,
        "security_score": 99,
        "is_online": True
    },
    {
        "id": "llava",
        "name": "LLaVA 1.5 7B Vision",
        "repo_id": "llava-hf/llava-1.5-7b-hf",
        "domain": "VISION_AI",
        "task_tag": "Visual QA & Multimodal",
        "description": "Open-source large multimodal model connecting vision encoder with Vicuna.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 56,
        "price_per_1k": 0.22,
        "security_score": 94,
        "is_online": True
    },
    {
        "id": "fingpt",
        "name": "FinGPT Forecaster",
        "repo_id": "FinGPT/fingpt-forecaster",
        "domain": "FINANCE",
        "task_tag": "Financial Sentiment",
        "description": "Fine-tuned financial analysis and market sentiment forecasting model.",
        "context_length": 8192,
        "parameters": "7B",
        "p50_latency_ms": 35,
        "price_per_1k": 0.10,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "mistral",
        "name": "Mistral 7B Instruct v0.3",
        "repo_id": "mistralai/Mistral-7B-Instruct-v0.3",
        "domain": "LLM_CHAT",
        "task_tag": "Function Calling",
        "description": "High-efficiency instruction model with native tool call and function schemas.",
        "context_length": 32768,
        "parameters": "7B",
        "p50_latency_ms": 34,
        "price_per_1k": 0.09,
        "security_score": 95,
        "is_online": True
    }
]

async def seed_database():
    print("[AgentHub Seed] Initializing database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # Seed Demo User
        demo_user_id = "usr_guest_demo"
        demo_user = User(
            id=demo_user_id,
            email="developer@agenthub.ai",
            handle="agenthub_dev",
            hashed_password=hash_password("demo_password_123"),
            role="developer"
        )
        demo_wallet = Wallet(
            id="wal_guest_demo",
            user_id=demo_user_id,
            balance_credits=500.0
        )
        session.add(demo_user)
        session.add(demo_wallet)
        
        # Seed AI Models
        for m_data in INITIAL_MODELS:
            model = AIModel(**m_data)
            session.add(model)
            
            # Seed OWASP Audit for model
            audit = OWASPAudit(
                id=f"audit_{m_data['id']}",
                model_id=m_data["id"],
                overall_score=m_data["security_score"],
                prompt_injection_score=m_data["security_score"],
                jailbreak_resistance_score=m_data["security_score"] - 1,
                task_hijacking_score=m_data["security_score"],
                data_leakage_score=m_data["security_score"] - 2,
                context_manipulation_score=m_data["security_score"] - 1,
                audit_summary=f"Automated OWASP Red-Team verification passed with {m_data['security_score']}% overall safety score.",
                vulnerabilities=[
                    {"test": "Prompt Injection Resistance", "status": "PASSED", "severity": "INFO"},
                    {"test": "Context Leakage Containment", "status": "PASSED", "severity": "LOW"}
                ]
            )
            session.add(audit)
            
        await session.commit()
        print("[AgentHub Seed] Seed completed: 6 Models, OWASP Audits, and Demo User provisioned with 500 Credits.")

if __name__ == "__main__":
    asyncio.run(seed_database())