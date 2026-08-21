import pytest
import asyncio
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_budget_aware_orchestration_high_vs_low():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Case 1: High budget user (e.g. 500 Credits) -> Generates High Performance 3-step DAG
        r1 = await client.post("/api/orchestrate", json={
            "goal": "Audit balance sheet variances and compile python compliance logic",
            "max_budget_credits": 100.0
        })
        assert r1.status_code == 200
        res1 = r1.json()
        assert res1["budget_strategy"] == "HIGH_PERFORMANCE_PREMIUM"
        assert len(res1["dag_plan"]) == 3
        
        # Case 2: Low budget user (e.g. 0.5 Credits) -> Autonomously condenses to 2-step economy DAG
        r2 = await client.post("/api/orchestrate", json={
            "goal": "Audit balance sheet variances and compile python compliance logic",
            "max_budget_credits": 0.5
        })
        assert r2.status_code == 200
        res2 = r2.json()
        assert res2["budget_strategy"] == "COST_OPTIMIZED_COMPACT"
        assert len(res2["dag_plan"]) == 2
        assert res2["estimated_cost_credits"] < res1["estimated_cost_credits"]

@pytest.mark.asyncio
async def test_creators_and_revenue_split():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/creators")
        assert r.status_code == 200
        creators = r.json()
        assert len(creators) >= 4
        assert any(c["id"] == "creator_meta" for c in creators)
        
        r2 = await client.get("/api/creators/creator_meta/earnings")
        assert r2.status_code == 200
        earnings = r2.json()
        assert earnings["revenue_split_percent"] == "80% Creator / 20% Platform Treasury"
        assert earnings["pending_payout_credits"] > 0

@pytest.mark.asyncio
async def test_creator_payout_withdrawal():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "creator_id": "creator_deepseek",
            "amount_credits": 100.0,
            "payout_method": "stripe_connect",
            "destination_address": "acct_1234567890_us_bank"
        }
        r = await client.post("/api/creators/payout", json=payload)
        assert r.status_code == 200
        payout = r.json()
        assert payout["status"] == "COMPLETED"
        assert payout["amount_usd"] == 1.0

@pytest.mark.asyncio
async def test_wallet_checkout():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "user_id": "usr_guest_demo",
            "credits_package": 500,
            "card_last4": "8888"
        }
        r = await client.post("/api/wallet/checkout", json=payload)
        assert r.status_code == 200
        chk = r.json()
        assert chk["credits_added"] == 500
        assert chk["status"] in ["COMPLETED", "CHECKOUT_CREATED"]

@pytest.mark.asyncio
async def test_concurrent_multi_user_sessions():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        async def run_user_session(user_idx: int):
            reg_r = await client.post("/api/auth/register", json={
                "email": f"user_conc_{user_idx}_{uuid.uuid4().hex[:6]}@test.com",
                "handle": f"u_conc_{user_idx}_{uuid.uuid4().hex[:6]}",
                "password": "Password123!"
            })
            user = reg_r.json()["user"]
            
            orch_r = await client.post("/api/orchestrate", json={
                "goal": f"User {user_idx} medical clinical review",
                "user_id": user["id"]
            })
            return orch_r.status_code == 200
            
        results = await asyncio.gather(*(run_user_session(i) for i in range(4)))
        assert all(results)