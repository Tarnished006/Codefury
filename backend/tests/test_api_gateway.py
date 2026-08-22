"""
Unit & Integration Tests for OpenAI-Compatible Inference Gateway
================================================================
Verifies:
  1. API key authentication & rejection of invalid/revoked keys (401).
  2. Gateway rejects unpurchased/unlicensed models (403 Forbidden).
  3. Successful chat completion proxying with OpenAI JSON schema.
  4. Proper credit deduction and balance update in SQLite.
  5. Streaming SSE chunks format (data: {...} ... data: [DONE]).
  6. List models endpoint (/v1/models).
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest
import hashlib
import uuid
import datetime
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.main import app
from app.database import AsyncSessionLocal
from app.models import User, ApiKey, AIModel, PurchasedModel


@pytest.mark.asyncio
async def test_gateway_rejects_missing_or_invalid_key():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Missing Authorization header
        resp = await client.post("/v1/chat/completions", json={
            "model": "llama3-8b-instruct",
            "messages": [{"role": "user", "content": "Hello"}]
        })
        assert resp.status_code == 401
        assert "Missing Authorization Bearer" in resp.json()["detail"]

        # 2. Invalid/fabricated key
        resp_invalid = await client.post(
            "/v1/chat/completions",
            headers={"Authorization": "Bearer ah_live_invalid_key_123456789"},
            json={
                "model": "llama3-8b-instruct",
                "messages": [{"role": "user", "content": "Hello"}]
            }
        )
        assert resp_invalid.status_code == 401
        assert "Invalid or revoked" in resp_invalid.json()["detail"]


@pytest.mark.asyncio
async def test_gateway_rejects_unpurchased_model_with_403():
    transport = ASGITransport(app=app)
    
    raw_key = f"ah_live_unpur_{uuid.uuid4().hex[:16]}"
    prefix = raw_key[:12]
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    user_id = f"usr_unpur_{uuid.uuid4().hex[:8]}"
    key_id = f"key_unpur_{uuid.uuid4().hex[:8]}"

    async with AsyncSessionLocal() as db:
        test_user = User(
            id=user_id,
            email=f"unpur_{uuid.uuid4().hex[:6]}@example.com",
            handle=f"unpur_{uuid.uuid4().hex[:4]}",
            hashed_password="hashed_test_pass"
        )
        test_key = ApiKey(
            id=key_id,
            user_id=user_id,
            name="Unpurchased Test Key",
            key_prefix=prefix,
            hashed_key=hashed,
            credits_balance=100.0,
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        # Seed ONLY llama3-8b-instruct as purchased
        purchased = PurchasedModel(
            id=f"pur_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            model_id="llama3-8b-instruct",
            price_paid=100.0
        )
        db.add(test_user)
        db.add(test_key)
        db.add(purchased)
        await db.commit()

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Attempt to call unpurchased deepseek-r1
        resp = await client.post(
            "/v1/chat/completions",
            headers={"Authorization": f"Bearer {raw_key}"},
            json={
                "model": "deepseek-r1",
                "messages": [{"role": "user", "content": "Calculate"}]
            }
        )
        assert resp.status_code == 403
        assert "not licensed" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_gateway_successful_completion_and_balance_deduction():
    transport = ASGITransport(app=app)
    
    # Setup test user and valid API key in DB
    raw_key = f"ah_live_test_{uuid.uuid4().hex[:16]}"
    prefix = raw_key[:12]
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    user_id = f"usr_test_{uuid.uuid4().hex[:8]}"
    key_id = f"key_test_{uuid.uuid4().hex[:8]}"

    initial_balance = 100.0

    async with AsyncSessionLocal() as db:
        test_user = User(
            id=user_id,
            email=f"test_{uuid.uuid4().hex[:6]}@example.com",
            handle=f"tester_{uuid.uuid4().hex[:4]}",
            hashed_password="hashed_test_pass"
        )
        test_key = ApiKey(
            id=key_id,
            user_id=user_id,
            name="Gateway Test Key",
            key_prefix=prefix,
            hashed_key=hashed,
            credits_balance=initial_balance,
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        # Grant purchase license for test model
        purchased = PurchasedModel(
            id=f"pur_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            model_id="llama3-8b-instruct",
            price_paid=100.0
        )
        db.add(test_user)
        db.add(test_key)
        db.add(purchased)
        await db.commit()

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Execute chat completion
        resp = await client.post(
            "/v1/chat/completions",
            headers={"Authorization": f"Bearer {raw_key}"},
            json={
                "model": "llama3-8b-instruct",
                "messages": [
                    {"role": "system", "content": "You are a concise AI assistant."},
                    {"role": "user", "content": "What is 2 + 2? Answer in one word."}
                ],
                "temperature": 0.1,
                "max_tokens": 64
            }
        )

        assert resp.status_code == 200
        data = resp.json()
        assert data["object"] == "chat.completion"
        assert "choices" in data
        assert len(data["choices"]) > 0
        assert data["choices"][0]["message"]["role"] == "assistant"
        assert len(data["choices"][0]["message"]["content"]) > 0
        assert "usage" in data
        assert data["usage"]["total_tokens"] > 0
        assert "agenthub_metadata" in data

    # Verify credit balance was deducted
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ApiKey).filter(ApiKey.id == key_id))
        updated_key = res.scalars().first()
        assert updated_key is not None
        assert updated_key.credits_balance < initial_balance


@pytest.mark.asyncio
async def test_gateway_streaming_sse_format():
    transport = ASGITransport(app=app)
    
    raw_key = f"ah_live_stream_{uuid.uuid4().hex[:16]}"
    prefix = raw_key[:12]
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    user_id = f"usr_stream_{uuid.uuid4().hex[:8]}"
    key_id = f"key_stream_{uuid.uuid4().hex[:8]}"

    async with AsyncSessionLocal() as db:
        test_user = User(
            id=user_id,
            email=f"stream_{uuid.uuid4().hex[:6]}@example.com",
            handle=f"stream_{uuid.uuid4().hex[:4]}",
            hashed_password="hashed_pass"
        )
        test_key = ApiKey(
            id=key_id,
            user_id=user_id,
            name="Stream Test Key",
            key_prefix=prefix,
            hashed_key=hashed,
            credits_balance=50.0,
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        purchased = PurchasedModel(
            id=f"pur_{uuid.uuid4().hex[:8]}",
            user_id=user_id,
            model_id="llama3-8b-instruct",
            price_paid=100.0
        )
        db.add(test_user)
        db.add(test_key)
        db.add(purchased)
        await db.commit()

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.post(
            "/v1/chat/completions",
            headers={"Authorization": f"Bearer {raw_key}"},
            json={
                "model": "llama3-8b-instruct",
                "messages": [{"role": "user", "content": "Count from 1 to 3."}],
                "stream": True
            }
        )

        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]
        text_body = resp.text
        assert "data: " in text_body
        assert "chat.completion.chunk" in text_body
        assert "data: [DONE]" in text_body


@pytest.mark.asyncio
async def test_gateway_list_models():
    transport = ASGITransport(app=app)
    
    raw_key = f"ah_live_list_{uuid.uuid4().hex[:16]}"
    prefix = raw_key[:12]
    hashed = hashlib.sha256(raw_key.encode()).hexdigest()
    user_id = f"usr_list_{uuid.uuid4().hex[:8]}"
    key_id = f"key_list_{uuid.uuid4().hex[:8]}"

    async with AsyncSessionLocal() as db:
        test_user = User(
            id=user_id,
            email=f"list_{uuid.uuid4().hex[:6]}@example.com",
            handle=f"list_{uuid.uuid4().hex[:4]}",
            hashed_password="hashed_pass"
        )
        test_key = ApiKey(
            id=key_id,
            user_id=user_id,
            name="List Test Key",
            key_prefix=prefix,
            hashed_key=hashed,
            credits_balance=50.0,
            is_active=True,
            created_at=datetime.datetime.utcnow()
        )
        db.add(test_user)
        db.add(test_key)
        await db.commit()

    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/v1/models", headers={"Authorization": f"Bearer {raw_key}"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["object"] == "list"
        assert len(data["data"]) > 0
        model_ids = [m["id"] for m in data["data"]]
        assert "llama3-8b-instruct" in model_ids or "llama-3.1-8b-instant" in model_ids
