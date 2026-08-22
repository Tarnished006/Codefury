"""
OpenAI-Compatible Inference Gateway Router
===========================================
Provides drop-in compatibility for OpenAI SDKs, cURL, Postman, and client applications.

Endpoints:
  • POST /v1/chat/completions (and /api/v1/chat/completions)
  • GET /v1/models (and /api/v1/models)

Authentication:
  • Requires `Authorization: Bearer ah_live_...` (or `ak_live_...`)
  • Verified against SQLite `api_keys` table.
  • Rejects invalid or revoked keys with HTTP 401 Unauthorized.
  • Deducts token cost from API key credit balance and updates double-entry ledger.

Providers Supported:
  • Groq Cloud API (high-speed LLaMA 3.3 70B, LLaMA 3.1 8B, DeepSeek R1)
  • Hugging Face Router API (https://router.huggingface.co/v1/chat/completions)
  • Registered Custom Cloud Endpoints (RunPod, vLLM, Ollama)
  • Universal LLM Service Failover (Groq / OpenAI gpt-5-mini fallback)
"""

import json
import time
import uuid
import logging
import asyncio
from typing import Any, AsyncGenerator, Dict, List, Optional, Union

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database import get_db, AsyncSessionLocal
from app.dependencies import verify_api_key
from app.models import ApiKey, AIModel, RegisteredEndpoint, User, PurchasedModel, Creator
from app.services.llm_service import llm_service
from app.services.ledger_service import ledger_service

logger = logging.getLogger("agenthub.gateway")

router = APIRouter(tags=["OpenAI-Compatible Gateway"])


# ── Schemas ────────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: system, user, or assistant")
    content: str = Field(..., description="Message content text")
    name: Optional[str] = None


class ChatCompletionRequest(BaseModel):
    model: str = Field(..., description="Target model ID, repo ID, or alias")
    messages: List[ChatMessage] = Field(..., description="Conversation history list")
    temperature: Optional[float] = Field(0.7, ge=0.0, le=2.0)
    top_p: Optional[float] = Field(1.0, ge=0.0, le=1.0)
    max_tokens: Optional[int] = Field(512, ge=1, le=8192)
    stream: Optional[bool] = Field(False, description="Whether to stream response chunks over SSE")
    presence_penalty: Optional[float] = 0.0
    frequency_penalty: Optional[float] = 0.0
    user: Optional[str] = None


# Model mapping table for resolving marketplace slugs to provider model names
GROQ_MODEL_MAP = {
    "llama3-8b-instruct": "llama-3.1-8b-instant",
    "llama3-70b-instruct": "llama-3.3-70b-versatile",
    "llama-3.3-70b-versatile": "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant": "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b": "deepseek-r1-distill-llama-70b",
    "mixtral-8x7b-32768": "mixtral-8x7b-32768",
    "gemma2-9b-it": "gemma2-9b-it",
    "openai/gpt-oss-120b": "openai/gpt-oss-120b",
    "openai/gpt-oss-20b": "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b": "qwen/qwen3.6-27b",
}

HF_MODEL_MAP = {
    "meta-llama/Llama-3.1-8B-Instruct": "meta-llama/Llama-3.1-8B-Instruct",
    "meta-llama/Meta-Llama-3-8B-Instruct": "meta-llama/Meta-Llama-3-8B-Instruct",
    "Qwen/Qwen2.5-Coder-32B-Instruct": "Qwen/Qwen2.5-Coder-32B-Instruct",
    "deepseek-coder-67b-instruct": "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct",
    "mistral-7b-instruct": "mistralai/Mistral-7B-Instruct-v0.3",
    "biomedlm-2-7b": "BioMistral/BioMistral-7B",
    "fingpt-forecaster-llama2": "FinGPT/fingpt-forecaster_dow30_llama2-7b_lora",
}


# ── Helper Execution Functions ─────────────────────────────────────────────────

def estimate_token_count(text: str) -> int:
    return max(1, len(text) // 4)


async def execute_groq_inference(
    model: str,
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    stream: bool
) -> Union[str, AsyncGenerator[str, None]]:
    """Executes chat completion via Groq Cloud API."""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is not configured.")

    headers = {
        "Authorization": f"Bearer {settings.GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": stream
    }

    if not stream:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                json=payload,
                headers=headers
            )
            if resp.status_code != 200:
                raise ValueError(f"Groq API returned HTTP {resp.status_code}: {resp.text}")
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    else:
        async def stream_generator():
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream(
                    "POST",
                    "https://api.groq.com/openai/v1/chat/completions",
                    json=payload,
                    headers=headers
                ) as resp:
                    if resp.status_code != 200:
                        yield f"Error from Groq: HTTP {resp.status_code}"
                        return
                    async for line in resp.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                chunk = json.loads(line[6:])
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except Exception:
                                pass
        return stream_generator()


async def execute_hf_router_inference(
    model_id: str,
    messages: List[Dict[str, str]],
    temperature: float,
    max_tokens: int,
    stream: bool
) -> Union[str, AsyncGenerator[str, None]]:
    """Executes chat completion via Hugging Face Serverless Router."""
    hf_token = settings.HF_TOKEN or settings.HUGGINGFACE_API_KEY
    headers = {
        "Content-Type": "application/json"
    }
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"

    # Hugging Face OpenAI-compatible Router endpoint
    url = "https://router.huggingface.co/v1/chat/completions"
    payload = {
        "model": model_id,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": stream
    }

    if not stream:
        async with httpx.AsyncClient(timeout=35.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"].get("content", "")
            
            # Fallback to direct model inference endpoint if router format differed
            direct_url = f"https://api-inference.huggingface.co/models/{model_id}"
            user_prompt = messages[-1]["content"] if messages else ""
            resp_direct = await client.post(
                direct_url,
                json={"inputs": user_prompt, "parameters": {"max_new_tokens": max_tokens, "temperature": temperature}},
                headers=headers
            )
            if resp_direct.status_code == 200:
                data_d = resp_direct.json()
                if isinstance(data_d, list) and len(data_d) > 0 and "generated_text" in data_d[0]:
                    return data_d[0]["generated_text"]
                elif "generated_text" in data_d:
                    return data_d["generated_text"]

            raise ValueError(f"Hugging Face returned status {resp.status_code}")
    else:
        async def stream_generator():
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", url, json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        yield f"[HF Router responded HTTP {resp.status_code}]"
                        return
                    async for line in resp.aiter_lines():
                        if line.startswith("data: ") and line != "data: [DONE]":
                            try:
                                chunk = json.loads(line[6:])
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content", "")
                                if content:
                                    yield content
                            except Exception:
                                pass
        return stream_generator()


# ── Main Chat Completions Endpoint ─────────────────────────────────────────────

@router.post("/v1/chat/completions")
@router.post("/api/v1/chat/completions")
async def chat_completions(
    req: ChatCompletionRequest,
    api_key: ApiKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    OpenAI-Compatible Chat Completions Gateway.
    Authenticates bearer token (ah_live_...), routes request to Groq/HF/Mesh,
    meters token usage, updates API key balance, and returns standard OpenAI JSON or SSE stream.
    """
    t0 = time.monotonic()
    completion_id = f"chatcmpl-{uuid.uuid4().hex[:16]}"
    created_ts = int(time.time())

    # Format messages
    dict_messages = [{"role": m.role, "content": m.content} for m in req.messages]
    last_user_prompt = ""
    for m in reversed(req.messages):
        if m.role == "user":
            last_user_prompt = m.content
            break
    if not last_user_prompt and req.messages:
        last_user_prompt = req.messages[-1].content

    # Calculate prompt token estimate
    prompt_tokens = sum(estimate_token_count(m.content) for m in req.messages)

    # 1. Resolve target model & price
    price_per_1k = 0.10
    model_res = await db.execute(
        select(AIModel).filter(
            (AIModel.id == req.model) | (AIModel.name == req.model) | (AIModel.repo_id == req.model)
        )
    )
    model_obj = model_res.scalars().first()
    if model_obj:
        price_per_1k = model_obj.price_per_1k or 0.10

    # Check registered endpoints
    ep_res = await db.execute(
        select(RegisteredEndpoint).filter(
            (RegisteredEndpoint.id == req.model) | (RegisteredEndpoint.model_name == req.model)
        )
    )
    endpoint_obj = ep_res.scalars().first()
    if endpoint_obj:
        price_per_1k = endpoint_obj.price_per_1k_tokens

    # Verify model is purchased/licensed by the user account
    user_id = api_key.user_id
    target_model_id = model_obj.id if model_obj else req.model
    
    p_res = await db.execute(
        select(PurchasedModel).filter(
            PurchasedModel.user_id == user_id,
            ((PurchasedModel.model_id == target_model_id) | (PurchasedModel.model_id == req.model))
        )
    )
    has_purchased = p_res.scalars().first() is not None

    if not has_purchased and model_obj and model_obj.creator_id:
        c_res = await db.execute(select(Creator).filter(Creator.id == model_obj.creator_id, Creator.user_id == user_id))
        if c_res.scalars().first():
            has_purchased = True

    if not has_purchased and endpoint_obj and endpoint_obj.developer_id == user_id:
        has_purchased = True

    if not has_purchased:
        all_user_purchases = await db.execute(select(PurchasedModel).filter(PurchasedModel.user_id == user_id))
        user_purchases = all_user_purchases.scalars().all()
        if user_purchases:
            purchased_names = ", ".join([p.model_id for p in user_purchases[:3]])
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Model '{req.model}' is not licensed for this API key. Licensed models: [{purchased_names}]. Please purchase '{req.model}' in the Marketplace."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Model '{req.model}' is not licensed for this API key. Please unlock model access in the AgentHub Marketplace."
            )

    # ── Non-Streaming Mode ─────────────────────────────────────────────────────
    if not req.stream:
        content_result = ""
        provider_used = "UNIVERSAL_MESH"

        # Route 1: Check Registered Endpoint URL
        if endpoint_obj and endpoint_obj.api_endpoint.startswith("http"):
            try:
                headers = {"Content-Type": "application/json"}
                if endpoint_obj.api_key_env_or_secret:
                    headers["Authorization"] = f"Bearer {endpoint_obj.api_key_env_or_secret}"
                async with httpx.AsyncClient(timeout=20.0) as client:
                    resp = await client.post(
                        endpoint_obj.api_endpoint,
                        json={"model": endpoint_obj.model_name, "messages": dict_messages, "max_tokens": req.max_tokens or 512},
                        headers=headers
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if "choices" in data:
                            content_result = data["choices"][0]["message"]["content"]
                        elif "response" in data:
                            content_result = data["response"]
                        provider_used = "CUSTOM_REGISTERED_ENDPOINT"
            except Exception as ex:
                logger.warning(f"Registered endpoint call failed: {ex}")

        # Route 2: Check Groq Provider
        if not content_result and settings.GROQ_API_KEY:
            groq_target = GROQ_MODEL_MAP.get(req.model, "llama-3.3-70b-versatile" if "70b" in req.model.lower() else "llama-3.1-8b-instant")
            try:
                content_result = await execute_groq_inference(
                    model=groq_target,
                    messages=dict_messages,
                    temperature=req.temperature or 0.7,
                    max_tokens=req.max_tokens or 512,
                    stream=False
                )
                provider_used = f"GROQ_CLOUD ({groq_target})"
            except Exception as ex:
                logger.warning(f"Groq gateway inference failed: {ex}")

        # Route 3: Check Hugging Face Provider
        if not content_result and (settings.HF_TOKEN or settings.HUGGINGFACE_API_KEY):
            hf_target = HF_MODEL_MAP.get(req.model, req.model)
            try:
                content_result = await execute_hf_router_inference(
                    model_id=hf_target,
                    messages=dict_messages,
                    temperature=req.temperature or 0.7,
                    max_tokens=req.max_tokens or 512,
                    stream=False
                )
                provider_used = f"HUGGING_FACE ({hf_target})"
            except Exception as ex:
                logger.warning(f"HF router inference failed: {ex}")

        # Route 4: Universal Fallback Engine
        if not content_result:
            content_result = await llm_service.generate_completion(
                prompt=last_user_prompt,
                system_prompt="You are an intelligent foundation model accessed via AgentHub Gateway.",
                temperature=req.temperature or 0.7,
                max_tokens=req.max_tokens or 512
            )
            provider_used = "AGENTHUB_UNIVERSAL_ROUTER"

        completion_tokens = estimate_token_count(content_result)
        total_tokens = prompt_tokens + completion_tokens
        cost_credits = max(0.001, round((total_tokens / 1000.0) * (price_per_1k or 0.10), 4))
        elapsed_ms = max(20, int((time.monotonic() - t0) * 1000))

        # Deduct credits from API Key balance
        key_user_id = api_key.user_id
        new_balance = max(0.0, round(api_key.credits_balance - cost_credits, 4))
        api_key.credits_balance = new_balance
        await db.commit()

        # Record in double-entry ledger
        try:
            async with AsyncSessionLocal() as session:
                await ledger_service.record_inference_metering(
                    db=session,
                    user_id=key_user_id,
                    model_id=req.model,
                    tokens=total_tokens,
                    cost_credits=cost_credits
                )
        except Exception as e:
            logger.warning(f"Ledger record error: {e}")

        return {
            "id": completion_id,
            "object": "chat.completion",
            "created": created_ts,
            "model": req.model,
            "choices": [
                {
                    "index": 0,
                    "message": {
                        "role": "assistant",
                        "content": content_result
                    },
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": total_tokens
            },
            "agenthub_metadata": {
                "latency_ms": elapsed_ms,
                "credits_deducted": cost_credits,
                "remaining_credits": round(new_balance, 4),
                "provider": provider_used
            }
        }

    # ── Streaming Mode (SSE) ──────────────────────────────────────────────────
    async def sse_event_stream():
        accumulated_tokens = 0
        
        # Initial chunk with role
        init_chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created_ts,
            "model": req.model,
            "choices": [{"index": 0, "delta": {"role": "assistant"}, "finish_reason": None}]
        }
        yield f"data: {json.dumps(init_chunk)}\n\n"

        # Stream from universal generator
        stream_gen = llm_service.stream_completion(
            prompt=last_user_prompt,
            system_prompt="You are an intelligent foundation model accessed via AgentHub Gateway.",
            temperature=req.temperature or 0.7,
            max_tokens=req.max_tokens or 512
        )

        async for chunk_text in stream_gen:
            if chunk_text:
                accumulated_tokens += estimate_token_count(chunk_text)
                chunk_obj = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": created_ts,
                    "model": req.model,
                    "choices": [{"index": 0, "delta": {"content": chunk_text}, "finish_reason": None}]
                }
                yield f"data: {json.dumps(chunk_obj)}\n\n"
                await asyncio.sleep(0.01)

        # Stop chunk
        stop_chunk = {
            "id": completion_id,
            "object": "chat.completion.chunk",
            "created": created_ts,
            "model": req.model,
            "choices": [{"index": 0, "delta": {}, "finish_reason": "stop"}]
        }
        yield f"data: {json.dumps(stop_chunk)}\n\n"
        yield "data: [DONE]\n\n"

        # Meter and deduct credits
        total_tokens = prompt_tokens + max(1, accumulated_tokens)
        cost_credits = round((total_tokens / 1000.0) * price_per_1k, 4)
        try:
            async with AsyncSessionLocal() as session:
                k_res = await session.execute(select(ApiKey).filter(ApiKey.id == api_key.id))
                live_key = k_res.scalars().first()
                if live_key:
                    live_key.credits_balance = max(0.0, round(live_key.credits_balance - cost_credits, 4))
                    await session.commit()
                await ledger_service.record_inference_metering(
                    db=session,
                    user_id=api_key.user_id,
                    model_id=req.model,
                    tokens=total_tokens,
                    cost_credits=cost_credits
                )
        except Exception as ex:
            logger.warning(f"Streaming ledger deduction error: {ex}")

    return StreamingResponse(
        sse_event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )


# ── List Models Endpoint ───────────────────────────────────────────────────────

@router.get("/v1/models")
@router.get("/api/v1/models")
async def list_gateway_models(
    api_key: ApiKey = Depends(verify_api_key),
    db: AsyncSession = Depends(get_db)
):
    """
    OpenAI-Compatible List Models Endpoint.
    Returns all foundation models and registered endpoints in standard OpenAI model schema.
    """
    res = await db.execute(select(AIModel).filter(AIModel.is_online == True))
    models = res.scalars().all()

    model_data = []
    for m in models:
        model_data.append({
            "id": m.id,
            "object": "model",
            "created": int(time.time()),
            "owned_by": m.creator_id or "agenthub",
            "permission": [],
            "root": m.id,
            "parent": None,
            "pricing": {
                "price_per_1k_tokens": m.price_per_1k,
                "currency": "CREDITS"
            }
        })

    # Include Groq defaults
    for gid in GROQ_MODELS_LIST:
        if not any(item["id"] == gid for item in model_data):
            model_data.append({
                "id": gid,
                "object": "model",
                "created": int(time.time()),
                "owned_by": "groq",
                "permission": [],
                "root": gid,
                "parent": None,
                "pricing": {"price_per_1k_tokens": 0.05, "currency": "CREDITS"}
            })

    return {
        "object": "list",
        "data": model_data
    }

GROQ_MODELS_LIST = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "deepseek-r1-distill-llama-70b",
    "mixtral-8x7b-32768",
    "gemma2-9b-it"
]
