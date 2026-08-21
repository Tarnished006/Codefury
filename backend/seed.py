import asyncio
import hashlib
from app.database import AsyncSessionLocal, engine, Base
from app.models import AIModel, OWASPAudit, User, Wallet, Creator, LedgerTransaction

def hash_password(password: str) -> str:
    salt = "agenthub_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

INITIAL_CREATORS = [
    {
        "id": "creator_meta",
        "name": "Meta AI Research",
        "handle": "meta_ai",
        "bio": "Foundational open-weight Llama model series and multimodal research.",
        "avatar_url": "https://avatars.githubusercontent.com/u/10262924?s=200&v=4",
        "total_earnings_credits": 2450.80,
        "pending_payout_credits": 1240.50
    },
    {
        "id": "creator_deepseek",
        "name": "DeepSeek AI Labs",
        "handle": "deepseek_ai",
        "bio": "Specialized high-throughput code synthesis and mathematical reasoning architectures.",
        "avatar_url": "https://avatars.githubusercontent.com/u/148332176?s=200&v=4",
        "total_earnings_credits": 1820.40,
        "pending_payout_credits": 890.20
    },
    {
        "id": "creator_biomed",
        "name": "BioMistral Consortium",
        "handle": "biomistral",
        "bio": "Domain-specific medical foundation models validated on PubMed benchmarks.",
        "avatar_url": "https://avatars.githubusercontent.com/u/158580975?s=200&v=4",
        "total_earnings_credits": 980.00,
        "pending_payout_credits": 650.00
    },
    {
        "id": "creator_fingpt",
        "name": "FinGPT Engineering Team",
        "handle": "fingpt_team",
        "bio": "Quantitative financial sentiment and regulatory compliance models.",
        "avatar_url": "https://avatars.githubusercontent.com/u/108390772?s=200&v=4",
        "total_earnings_credits": 760.30,
        "pending_payout_credits": 410.80
    }
]

INITIAL_MODELS = [
    {
        "id": "llama3",
        "creator_id": "creator_meta",
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
        "creator_id": "creator_deepseek",
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
        "creator_id": "creator_biomed",
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
        "creator_id": "creator_meta",
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
        "creator_id": "creator_fingpt",
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
        "creator_id": "creator_meta",
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
    print("[AgentHub Seed] Re-initializing database schemas for dual-sided marketplace...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # 1. Seed Creators
        for c_data in INITIAL_CREATORS:
            creator = Creator(**c_data)
            session.add(creator)
            
        # 2. Seed Demo User & Wallet
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
        
        # 3. Seed AI Models & OWASP Audits
        for m_data in INITIAL_MODELS:
            model = AIModel(**m_data)
            session.add(model)
            
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
        print("[AgentHub Seed] Seed complete: 4 Creators, 6 Models, OWASP Audits, and Demo User provisioned.")

if __name__ == "__main__":
    asyncio.run(seed_database())