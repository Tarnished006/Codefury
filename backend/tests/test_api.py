import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_root_and_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r1 = await client.get("/")
        assert r1.status_code == 200
        assert r1.json()["status"] == "OPERATIONAL"
        
        r2 = await client.get("/health")
        assert r2.status_code == 200
        assert r2.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_strict_auth_register_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        unique_email = f"dev_{uuid.uuid4().hex[:6]}@agenthub.ai"
        unique_handle = f"dev_{uuid.uuid4().hex[:6]}"
        
        # 1. Register
        r_reg = await client.post("/api/auth/register", json={
            "email": unique_email,
            "handle": unique_handle,
            "password": "SecurePassword2026!"
        })
        assert r_reg.status_code == 200
        data = r_reg.json()
        assert "access_token" in data
        assert data["user"]["credits"] == 500.0

        # 2. Login
        r_log = await client.post("/api/auth/login", json={
            "email": unique_email,
            "password": "SecurePassword2026!"
        })
        assert r_log.status_code == 200
        assert "access_token" in r_log.json()

        # 3. GET /me
        token = r_log.json()["access_token"]
        r_me = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r_me.status_code == 200
        assert r_me.json()["email"] == unique_email

@pytest.mark.asyncio
async def test_2026_models_catalog():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/models")
        assert r.status_code == 200
        models = r.json()
        assert len(models) >= 10
        assert any(m["id"] == "llama4_scout" for m in models)
        assert any(m["id"] == "qwen3_6" for m in models)
        assert any(m["id"] == "deepseek_v4" for m in models)

@pytest.mark.asyncio
async def test_meta_agent_orchestrator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"goal": "Synthesize Python backend API with automated unit testing"}
        r = await client.post("/api/orchestrate", json=payload)
        assert r.status_code == 200
        res = r.json()
        assert res["status"] == "SUCCESS"
        assert len(res["dag_plan"]) >= 2

@pytest.mark.asyncio
async def test_owasp_security_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/audit/llama4_scout")
        assert r.status_code == 200
        res = r.json()
        assert res["overall_score"] >= 80
        assert "scores" in res
        assert res["scores"]["prompt_injection"] >= 80

@pytest.mark.asyncio
async def test_sandbox_execution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "language": "python",
            "code": "print('AgentHub 2026 Sandbox OK')",
            "model_id": "llama4_scout"
        }
        r = await client.post("/api/sandbox/execute", json=payload)
        assert r.status_code == 200
        assert r.json()["status"] == "SUCCESS"