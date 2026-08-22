import asyncio
import sqlite3
from pathlib import Path
from app.database import AsyncSessionLocal, engine, Base
from sqlalchemy.future import select
from app.models import AIModel, User, PurchasedModel, Wallet, Creator, OWASPAudit
from seed import EXPANDED_MODEL_CATALOG, INITIAL_CREATORS, hash_password

DB_PATH = Path("agenthub.db")

REALISTIC_PRICING_MAP = {
    # 70B+ / Frontier
    "deepseek-r1": {"price_per_1k": 5.80, "purchase_price": 350.0},
    "llama3-70b-instruct": {"price_per_1k": 4.50, "purchase_price": 300.0},
    "llama33-70b-instruct": {"price_per_1k": 4.80, "purchase_price": 320.0},
    "deepseek-coder-67b-instruct": {"price_per_1k": 4.20, "purchase_price": 280.0},
    "qwen25-72b-instruct": {"price_per_1k": 4.60, "purchase_price": 310.0},
    
    # 27B - 34B
    "qwen25-coder-32b-instruct": {"price_per_1k": 2.80, "purchase_price": 200.0},
    "qwen25-32b-instruct": {"price_per_1k": 2.60, "purchase_price": 190.0},
    "gemma2-27b-it": {"price_per_1k": 2.40, "purchase_price": 180.0},
    "deepseek-coder-33b-instruct": {"price_per_1k": 2.70, "purchase_price": 195.0},
    "codestral-22b": {"price_per_1k": 2.20, "purchase_price": 170.0},
    
    # 12B - 14B
    "mistral-nemo-12b-instruct": {"price_per_1k": 1.80, "purchase_price": 140.0},
    "qwen25-14b-instruct": {"price_per_1k": 1.90, "purchase_price": 150.0},
    "qwen25-coder-14b-instruct": {"price_per_1k": 1.95, "purchase_price": 155.0},
    "phi35-mini-instruct": {"price_per_1k": 0.85, "purchase_price": 80.0},
    
    # 7B - 9B
    "llama3-8b-instruct": {"price_per_1k": 1.20, "purchase_price": 100.0},
    "llama31-8b-instruct": {"price_per_1k": 1.35, "purchase_price": 110.0},
    "mistral-7b-instruct": {"price_per_1k": 1.15, "purchase_price": 95.0},
    "biomedlm-2-7b": {"price_per_1k": 1.45, "purchase_price": 125.0},
    "fingpt-forecaster-llama2": {"price_per_1k": 1.50, "purchase_price": 130.0},
    "gemma2-9b-it": {"price_per_1k": 1.30, "purchase_price": 105.0},
    "deepseek-coder-67b": {"price_per_1k": 4.20, "purchase_price": 280.0},
    "deepseek-coder-7b-instruct": {"price_per_1k": 1.25, "purchase_price": 100.0},
    "qwen25-7b-instruct": {"price_per_1k": 1.20, "purchase_price": 100.0},
    "qwen25-coder-7b-instruct": {"price_per_1k": 1.30, "purchase_price": 105.0},
    "meditron-7b": {"price_per_1k": 1.40, "purchase_price": 120.0},
    "fin-llama-3-8b": {"price_per_1k": 1.45, "purchase_price": 125.0},
    "thefinai-finma-7b": {"price_per_1k": 1.35, "purchase_price": 115.0},
    "clinical-camel-70b": {"price_per_1k": 4.90, "purchase_price": 330.0},
    "huatuogpt-ii-7b": {"price_per_1k": 1.30, "purchase_price": 110.0},

    # Lightweight 1B - 3B
    "llama32-3b-instruct": {"price_per_1k": 0.65, "purchase_price": 60.0},
    "llama32-1b-instruct": {"price_per_1k": 0.45, "purchase_price": 50.0},
    "gemma2-2b-it": {"price_per_1k": 0.50, "purchase_price": 50.0},
    "qwen25-coder-15b-instruct": {"price_per_1k": 0.55, "purchase_price": 55.0},
    "qwen25-coder-3b-instruct": {"price_per_1k": 0.65, "purchase_price": 60.0},
    "qwen25-3b-instruct": {"price_per_1k": 0.60, "purchase_price": 55.0},
    "smollm-135m-instruct": {"price_per_1k": 0.20, "purchase_price": 25.0},
    "smollm-360m-instruct": {"price_per_1k": 0.30, "purchase_price": 30.0},
    "smollm-17b-instruct": {"price_per_1k": 0.45, "purchase_price": 45.0}
}

async def update_all_pricing():
    print("[Pricing Update] Scaling all model token costs and purchase prices realistically...")
    async with AsyncSessionLocal() as session:
        # 1. Update AIModels pricing
        res = await session.execute(select(AIModel))
        models = res.scalars().all()
        for m in models:
            if m.id in REALISTIC_PRICING_MAP:
                m.price_per_1k = REALISTIC_PRICING_MAP[m.id]["price_per_1k"]
                m.purchase_price = REALISTIC_PRICING_MAP[m.id]["purchase_price"]
            else:
                params = str(m.parameters or "").upper()
                if "70B" in params or "67B" in params or "72B" in params:
                    m.price_per_1k = 4.50
                    m.purchase_price = 300.0
                elif "32B" in params or "33B" in params or "27B" in params:
                    m.price_per_1k = 2.60
                    m.purchase_price = 190.0
                elif "14B" in params or "13B" in params or "12B" in params:
                    m.price_per_1k = 1.85
                    m.purchase_price = 145.0
                elif "7B" in params or "8B" in params:
                    m.price_per_1k = 1.20
                    m.purchase_price = 100.0
                elif "1B" in params or "2B" in params or "3B" in params:
                    m.price_per_1k = 0.65
                    m.purchase_price = 60.0
                else:
                    m.price_per_1k = 0.35
                    m.purchase_price = 40.0

        # 2. Ensure demo user has initial purchased models seeded
        demo_user_id = "usr_guest_demo"
        u_res = await session.execute(select(User).filter(User.id == demo_user_id))
        demo_user = u_res.scalars().first()
        if demo_user:
            starter_models = ["llama3-8b-instruct", "biomedlm-2-7b", "fingpt-forecaster-llama2", "mistral-7b-instruct", "deepseek-coder-7b-instruct"]
            for sm_id in starter_models:
                p_check = await session.execute(
                    select(PurchasedModel).filter(
                        PurchasedModel.user_id == demo_user_id,
                        PurchasedModel.model_id == sm_id
                    )
                )
                if not p_check.scalars().first():
                    pm = PurchasedModel(
                        id=f"pur_demo_{sm_id[:10]}",
                        user_id=demo_user_id,
                        model_id=sm_id,
                        price_paid=100.0
                    )
                    session.add(pm)

        await session.commit()
        print(f"[Pricing Update] Successfully updated pricing across {len(models)} foundation models.")

if __name__ == "__main__":
    asyncio.run(update_all_pricing())
