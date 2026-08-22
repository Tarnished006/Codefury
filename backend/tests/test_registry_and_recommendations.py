import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_api_registry_deploy_and_proxy_inference():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Deploy / Register a genuine, verified model endpoint
        deploy_payload = {
            "developer_id": "usr_test_dev_01",
            "model_name": "DeepSeek Coder Fast Gateway",
            "domain": "CODE GEN",
            "task_tag": "Full-Stack Software Engineering",
            "api_endpoint": "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-6.7b-instruct",
            "api_key_env_or_secret": "hf_test_secret_token",
            "price_per_1k_tokens": 0.14,
            "context_length": 16384
        }
        res_deploy = await ac.post("/api/registry/deploy", json=deploy_payload)
        assert res_deploy.status_code == 201
        data = res_deploy.json()
        assert "id" in data
        assert data["model_name"] == "DeepSeek Coder Fast Gateway"
        assert "gateway_proxy_url" in data
        endpoint_id = data["id"]

        # 2. List registered endpoints
        res_list = await ac.get("/api/registry/endpoints")
        assert res_list.status_code == 200
        endpoints = res_list.json()
        assert any(ep["id"] == endpoint_id for ep in endpoints)

        # 3. Invoke Proxy Inference
        proxy_payload = {
            "endpoint_id": endpoint_id,
            "prompt": "Write a Python function to compute the Fibonacci sequence using memoization.",
            "max_tokens": 300,
            "temperature": 0.2,
            "user_id": "usr_test_consumer_01"
        }
        res_proxy = await ac.post("/api/registry/proxy-inference", json=proxy_payload)
        assert res_proxy.status_code == 200
        proxy_data = res_proxy.json()
        assert proxy_data["status"] == "SUCCESS"
        assert len(proxy_data["response"]) > 0
        assert proxy_data["tokens_metered"] > 0
        assert proxy_data["latency_ms"] >= 0


@pytest.mark.asyncio
async def test_api_registry_rejects_fake_nonexistent_models():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Attempt to register a bogus/non-existent Hugging Face repo
        bogus_payload = {
            "developer_id": "usr_test_dev_01",
            "model_name": "Bogus Fake Model 9999",
            "domain": "CODE GEN",
            "api_endpoint": "https://huggingface.co/nonexistent-org-xyz12345/fake-model-does-not-exist-9999",
            "price_per_1k_tokens": 0.10,
            "context_length": 8192
        }
        res = await ac.post("/api/registry/deploy", json=bogus_payload)
        # Must be rejected with HTTP 400 Bad Request
        assert res.status_code == 400
        data = res.json()
        assert "Verification Failed" in data["detail"] or "does not exist" in data["detail"]


@pytest.mark.asyncio
async def test_intelligent_model_recommendations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        rec_payload = {
            "use_case": "High-throughput clinical healthcare report summarization under strict HIPAA constraints",
            "domain": "HEALTHCARE",
            "budget_tier": "PERFORMANCE",
            "min_context_length": 8192,
            "max_latency_ms": 60,
            "priority": "quality"
        }
        res = await ac.post("/api/models/recommend", json=rec_payload)
        assert res.status_code == 200
        data = res.json()
        assert len(data["recommended_models"]) >= 1
        assert "architect_summary" in data
        assert data["total_models_evaluated"] > 0

        # Check top recommended model
        top_rec = data["recommended_models"][0]
        assert "model_id" in top_rec
        assert "match_score" in top_rec
        assert top_rec["match_score"] >= 70
        assert "fit_rationale" in top_rec
        assert len(top_rec["pros"]) > 0


@pytest.mark.asyncio
async def test_platform_ai_copilot_chat():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        chat_payload = {
            "message": "Which model should I use for financial market sentiment analysis and what is its pricing?",
            "chat_history": [],
            "current_page": "/arena",
            "user_credits": 350.0
        }
        res = await ac.post("/api/assistant/chat", json=chat_payload)
        assert res.status_code == 200
        data = res.json()
        assert "reply" in data
        assert len(data["reply"]) > 0
        assert "suggested_actions" in data
