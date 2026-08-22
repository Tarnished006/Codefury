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
async def test_expanded_50_models_catalog_and_domains():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # All models
        r = await client.get("/api/models")
        assert r.status_code == 200
        models = r.json()
        assert len(models) >= 50
        
        # Domain filtering tests
        domains = ["LLM CHAT", "CODE GEN", "VISION AI", "HEALTHCARE", "FINANCE"]
        for dom in domains:
            r_dom = await client.get(f"/api/models?domain={dom}")
            assert r_dom.status_code == 200
            dom_models = r_dom.json()
            assert len(dom_models) >= 10, f"Domain {dom} should have at least 10 verified models"

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
        r = await client.get("/api/audit/llama3-8b-instruct")
        assert r.status_code == 200
        res = r.json()
        # Core score fields
        assert res["overall_score"] >= 0
        assert "scores" in res
        assert res["scores"]["prompt_injection"] >= 0
        assert res["scores"]["jailbreak_resistance"] >= 0
        # Live audit enrichment fields
        assert "reasoning" in res
        assert "probe_outputs" in res
        assert isinstance(res["probe_outputs"], list)
        assert len(res["probe_outputs"]) == 5
        for po in res["probe_outputs"]:
            assert "axis" in po
            assert "probe" in po
            assert "response" in po
        assert res.get("evaluated_by") is not None
        assert res.get("repo_id") is not None

@pytest.mark.asyncio
async def test_api_key_creation_and_revocation():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"name": "Test Key for Auth"}
        r = await client.post("/api/auth/api-keys", json=payload)
        assert r.status_code == 200
        res = r.json()
        assert res["api_key"].startswith("ah_live_")
        assert "id" in res
        key_id = res["id"]

        # Test key revocation / deletion
        del_r = await client.delete(f"/api/auth/api-keys/{key_id}")
        assert del_r.status_code == 200
        del_res = del_r.json()
        assert del_res["status"] == "SUCCESS"