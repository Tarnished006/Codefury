"""
AgentHub Global AI Assistant & Platform Copilot Router
======================================================
Provides interactive conversational assistance across the platform:
  • Accepts { message: str, chat_history: list } or { messages: list }
  • Recommends optimal models based on live catalog telemetry
  • Guides users on wallet top-ups, creator payouts, and API keys
  • Assists with Python/JS SDK integrations and MCP server setup
  • Explains OWASP LLM security vulnerabilities and mitigations
"""

import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.services.assistant_engine import assistant_engine
from app.services.llm_service import llm_service

logger = logging.getLogger("agenthub.assistant")
router = APIRouter(prefix="/assistant", tags=["Platform AI Copilot"])


class ChatMessage(BaseModel):
    role: str = Field("user", description="'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message text")


class AssistantChatRequest(BaseModel):
    message: Optional[str] = Field(None, description="Current user prompt")
    chat_history: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of previous {role, content} turns")
    messages: Optional[List[ChatMessage]] = Field(None, description="Alternative standard messages array")
    current_page: Optional[str] = Field("/", description="Current URL route for contextual awareness")
    user_handle: Optional[str] = Field(None, description="Username if authenticated")
    user_credits: Optional[float] = Field(None, description="Current wallet credit balance")


class AssistantChatResponse(BaseModel):
    reply: str
    suggested_models: List[Dict[str, Any]] = []
    suggested_actions: List[Dict[str, str]] = []


@router.post("/chat", response_model=AssistantChatResponse)
async def chat_with_assistant(
    req: AssistantChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Intelligent Platform Copilot:
    Analyzes user workload requirements against the live 51+ model catalog and returns
    conversational advice, copy-pasteable code, and explicit model recommendations.
    """
    # Normalize input parameters
    user_msg = req.message
    history: List[Dict[str, str]] = []

    if req.messages and len(req.messages) > 0:
        for m in req.messages[:-1]:
            history.append({"role": m.role, "content": m.content})
        if not user_msg:
            user_msg = req.messages[-1].content
    elif req.chat_history:
        for h in req.chat_history:
            history.append({"role": h.get("role", "user"), "content": h.get("content", "")})

    if not user_msg:
        user_msg = "Hello! What can AgentHub do?"

    result = await assistant_engine.chat(
        message=user_msg,
        chat_history=history,
        current_page=req.current_page,
        user_credits=req.user_credits,
        user_handle=req.user_handle,
        db=db,
    )

    return AssistantChatResponse(
        reply=result["reply"],
        suggested_models=result.get("suggested_models", []),
        suggested_actions=result.get("suggested_actions", []),
    )


@router.post("/stream")
async def stream_assistant_chat(
    req: AssistantChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """Streams conversational token chunks for real-time interactive typing."""
    user_msg = req.message or (req.messages[-1].content if req.messages else "Hello")
    models = await assistant_engine.get_grounded_catalog(db)
    catalog_str = assistant_engine._build_catalog_text(models)

    system_prompt = (
        f"You are the official AgentHub AI Platform Copilot.\n"
        f"Live Model Catalog:\n{catalog_str}\n"
        f"Context: User is on page '{req.current_page}'. Provide concise, helpful model guidance."
    )

    async def sse_generator():
        async for chunk in llm_service.stream_completion(
            prompt=user_msg,
            system_prompt=system_prompt,
            model_id="agenthub-copilot",
            temperature=0.3,
            max_tokens=800
        ):
            yield f"data: {json.dumps(chunk)}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")
