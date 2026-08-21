import asyncio
import bcrypt
import hashlib
from app.database import AsyncSessionLocal, engine, Base
from app.models import AIModel, OWASPAudit, User, Wallet, Creator

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

INITIAL_CREATORS = [
    {
        "id": "creator_meta",
        "name": "Meta AI Research",
        "handle": "meta_ai",
        "bio": "Foundational open-weight Llama model series and multimodal research.",
        "avatar_url": "https://avatars.githubusercontent.com/u/10262924?s=200&v=4",
        "total_earnings_credits": 3450.80,
        "pending_payout_credits": 1440.50
    },
    {
        "id": "creator_deepseek",
        "name": "DeepSeek AI Labs",
        "handle": "deepseek_ai",
        "bio": "DeepSeek-V4-Pro, V3 MoE architectures, and mathematical code synthesis.",
        "avatar_url": "https://avatars.githubusercontent.com/u/148332176?s=200&v=4",
        "total_earnings_credits": 2820.40,
        "pending_payout_credits": 1190.20
    },
    {
        "id": "creator_mistral",
        "name": "Mistral AI",
        "handle": "mistral_ai",
        "bio": "European frontier open weights including Mistral Large 2407 & Mixtral 8x22B.",
        "avatar_url": "https://avatars.githubusercontent.com/u/132338006?s=200&v=4",
        "total_earnings_credits": 2180.00,
        "pending_payout_credits": 950.00
    },
    {
        "id": "creator_qwen",
        "name": "Qwen Team (Alibaba)",
        "handle": "qwen_ai",
        "bio": "State-of-the-art multilingual and programming foundation models.",
        "avatar_url": "https://avatars.githubusercontent.com/u/35070265?s=200&v=4",
        "total_earnings_credits": 1960.30,
        "pending_payout_credits": 810.80
    }
]

MODELS_2026_CATALOG = [
    # ── REASONING MODELS ──
    {
        "id": "llama4_scout",
        "creator_id": "creator_meta",
        "name": "Llama 4 Scout 109B",
        "repo_id": "meta-llama/Meta-Llama-4-Scout-109B",
        "domain": "REASONING",
        "task_tag": "Frontier Reasoning",
        "description": "Meta frontier 109B Scout architecture with 128k context and deep chain-of-thought.",
        "context_length": 131072,
        "parameters": "109B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.28,
        "security_score": 99,
        "is_online": True
    },
    {
        "id": "llama3",
        "creator_id": "creator_meta",
        "name": "Llama 3 8B Instruct",
        "repo_id": "meta-llama/Meta-Llama-3-8B-Instruct",
        "domain": "REASONING",
        "task_tag": "General Instruction",
        "description": "Ultra-fast open weight instruction tuned model for general workflows.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 28,
        "price_per_1k": 0.08,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "deepseek_v4",
        "creator_id": "creator_deepseek",
        "name": "DeepSeek V4 Pro",
        "repo_id": "deepseek-ai/DeepSeek-V4-Pro",
        "domain": "REASONING",
        "task_tag": "MoE Reasoning",
        "description": "Next-generation Mixture-of-Experts architecture with 671B total parameters.",
        "context_length": 131072,
        "parameters": "671B",
        "p50_latency_ms": 45,
        "price_per_1k": 0.32,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "deepseek_v3",
        "creator_id": "creator_deepseek",
        "name": "DeepSeek V3",
        "repo_id": "deepseek-ai/DeepSeek-V3",
        "domain": "REASONING",
        "task_tag": "High-Throughput MoE",
        "description": "Multi-head latent attention (MLA) MoE model delivering frontier intelligence.",
        "context_length": 65536,
        "parameters": "671B",
        "p50_latency_ms": 38,
        "price_per_1k": 0.22,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "mistral_large",
        "creator_id": "creator_mistral",
        "name": "Mistral Large 2407",
        "repo_id": "mistralai/Mistral-Large-Instruct-2407",
        "domain": "REASONING",
        "task_tag": "Multilingual Reasoning",
        "description": "123B flagship multilingual model with native reasoning and function schemas.",
        "context_length": 128000,
        "parameters": "123B",
        "p50_latency_ms": 40,
        "price_per_1k": 0.25,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "mixtral_8x22b",
        "creator_id": "creator_mistral",
        "name": "Mixtral 8x22B Instruct",
        "repo_id": "mistralai/Mixtral-8x22B-Instruct-v0.1",
        "domain": "REASONING",
        "task_tag": "Sparse MoE",
        "description": "176B total parameter sparse Mixture-of-Experts with 39B active params.",
        "context_length": 65536,
        "parameters": "8x22B",
        "p50_latency_ms": 36,
        "price_per_1k": 0.18,
        "security_score": 95,
        "is_online": True
    },

    # ── CODING MODELS ──
    {
        "id": "qwen3_6",
        "creator_id": "creator_qwen",
        "name": "Qwen 3.6 27B Instruct",
        "repo_id": "Qwen/Qwen3.6-27B-Instruct",
        "domain": "CODE_GEN",
        "task_tag": "Full-Stack Code Synthesis",
        "description": "2026 flagship code and mathematics intelligence model with 128k context.",
        "context_length": 131072,
        "parameters": "27B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.14,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "qwen2_5_coder",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 Coder 32B",
        "repo_id": "Qwen/Qwen2.5-Coder-32B-Instruct",
        "domain": "CODE_GEN",
        "task_tag": "Code Synthesis & Debugging",
        "description": "Specialized 32B code model matching proprietary frontier coding benchmarks.",
        "context_length": 131072,
        "parameters": "32B",
        "p50_latency_ms": 34,
        "price_per_1k": 0.16,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "glm5_1",
        "creator_id": "creator_qwen",
        "name": "GLM 5.1 Foundation",
        "repo_id": "zai-org/GLM-5.1",
        "domain": "CODE_GEN",
        "task_tag": "Algorithmic Synthesis",
        "description": "Bilingual Chinese/English foundation model optimized for code execution.",
        "context_length": 131072,
        "parameters": "32B",
        "p50_latency_ms": 33,
        "price_per_1k": 0.15,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "deepseek_coder_v2",
        "creator_id": "creator_deepseek",
        "name": "DeepSeek Coder V2",
        "repo_id": "deepseek-ai/DeepSeek-Coder-V2-Instruct",
        "domain": "CODE_GEN",
        "task_tag": "Multi-Language Code MoE",
        "description": "236B MoE coder supporting 338 programming languages and 128k context.",
        "context_length": 131072,
        "parameters": "236B",
        "p50_latency_ms": 35,
        "price_per_1k": 0.18,
        "security_score": 97,
        "is_online": True
    },

    # ── EDGE MODELS ──
    {
        "id": "gemma3_27b",
        "creator_id": "creator_meta",
        "name": "Gemma 3 27B IT",
        "repo_id": "google/gemma-3-27b-it",
        "domain": "EDGE_AI",
        "task_tag": "Edge Instruction",
        "description": "Google next-gen lightweight open foundation model with high reasoning density.",
        "context_length": 32768,
        "parameters": "27B",
        "p50_latency_ms": 29,
        "price_per_1k": 0.12,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "gemma2_9b",
        "creator_id": "creator_meta",
        "name": "Gemma 2 9B IT",
        "repo_id": "google/gemma-2-9b-it",
        "domain": "EDGE_AI",
        "task_tag": "On-Device Edge",
        "description": "High-efficiency 9B model matching 30B class model benchmarks on edge devices.",
        "context_length": 8192,
        "parameters": "9B",
        "p50_latency_ms": 22,
        "price_per_1k": 0.06,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "phi3_mini",
        "creator_id": "creator_meta",
        "name": "Phi-3 Mini 4K",
        "repo_id": "microsoft/Phi-3-mini-4k-instruct",
        "domain": "EDGE_AI",
        "task_tag": "Ultra-Low Latency",
        "description": "Microsoft 3.8B ultra-compact transformer model with exceptional quality per token.",
        "context_length": 4096,
        "parameters": "3.8B",
        "p50_latency_ms": 16,
        "price_per_1k": 0.04,
        "security_score": 95,
        "is_online": True
    }
]

async def seed_database():
    print("[AgentHub Seed] Seeding 2026 Model Catalog (13 Models) & Creator Accounts...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # 1. Seed Creators
        for c_data in INITIAL_CREATORS:
            creator = Creator(**c_data)
            session.add(creator)
            
        # 2. Seed Default Developer User & Wallet
        demo_user_id = "usr_guest_demo"
        demo_user = User(
            id=demo_user_id,
            email="developer@agenthub.ai",
            handle="agenthub_dev",
            hashed_password=hash_password("demo_password_123"),
            role="consumer"
        )
        demo_wallet = Wallet(
            id="wal_guest_demo",
            user_id=demo_user_id,
            balance_credits=500.0
        )
        session.add(demo_user)
        session.add(demo_wallet)
        
        # 3. Seed 2026 AI Models & OWASP Audits
        for m_data in MODELS_2026_CATALOG:
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
                    {"test": "Direct Prompt Override", "status": "PASSED", "severity": "INFO"},
                    {"test": "Task Hijacking Containment", "status": "PASSED", "severity": "LOW"}
                ]
            )
            session.add(audit)
            
        await session.commit()
        print(f"[AgentHub Seed] Seed complete: {len(INITIAL_CREATORS)} Creators and {len(MODELS_2026_CATALOG)} Models (2026 Catalog) provisioned.")

if __name__ == "__main__":
    asyncio.run(seed_database())