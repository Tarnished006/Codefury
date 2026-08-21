import pytest
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
async def test_guest_demo_auth():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/api/auth/guest-demo")
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["credits"] == 500.0

@pytest.mark.asyncio
async def test_models_catalog():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/models")
        assert r.status_code == 200
        models = r.json()
        assert len(models) >= 6
        assert any(m["id"] == "llama3" for m in models)

@pytest.mark.asyncio
async def test_meta_agent_orchestrator():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {"goal": "Review financial balance sheet anomalies and write audit python script"}
        r = await client.post("/api/orchestrate", json=payload)
        assert r.status_code == 200
        res = r.json()
        assert res["status"] == "SUCCESS"
        assert len(res["dag_plan"]) == 3
        assert res["dag_plan"][0]["assigned_model_id"] == "fingpt"

@pytest.mark.asyncio
async def test_owasp_security_audit():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.get("/api/audit/llama3")
        assert r.status_code == 200
        res = r.json()
        assert res["overall_score"] == 98
        assert res["prompt_injection_score"] == 98

@pytest.mark.asyncio
async def test_sandbox_execution():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        payload = {
            "language": "python",
            "code": "print('AgentHub testing')",
            "model_id": "llama3"
        }
        r = await client.post("/api/sandbox/execute", json=payload)
        assert r.status_code == 200
        assert r.json()["status"] == "SUCCESS"