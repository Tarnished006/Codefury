import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db, AsyncSessionLocal
from app.models import AIModel
from app.schemas import AIModelResponse, ModelInferenceRequest
from app.services import hf_service
from app.services.ledger_service import ledger_service

router = APIRouter(prefix="/models", tags=["AI Models & Real-Time Token Metering"])

@router.get("", response_model=List[AIModelResponse])
async def list_models(domain: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(AIModel).options(selectinload(AIModel.creator))
    if domain and domain != "ALL_DOMAINS":
        query = query.filter(AIModel.domain == domain)
    result = await db.execute(query)
    models = result.scalars().all()
    
    return [
        AIModelResponse(
            id=m.id,
            name=m.name,
            repo_id=m.repo_id,
            domain=m.domain,
            task_tag=m.task_tag,
            description=m.description,
            context_length=m.context_length,
            parameters=m.parameters,
            p50_latency_ms=m.p50_latency_ms,
            price_per_1k=m.price_per_1k,
            security_score=m.security_score,
            is_online=m.is_online,
            creator_id=m.creator_id,
            creator_name=m.creator.name if m.creator else "Open Source Contributor"
        )
        for m in models
    ]

@router.get("/{model_id}", response_model=AIModelResponse)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIModel).options(selectinload(AIModel.creator)).filter(AIModel.id == model_id))
    m = result.scalars().first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return AIModelResponse(
        id=m.id,
        name=m.name,
        repo_id=m.repo_id,
        domain=m.domain,
        task_tag=m.task_tag,
        description=m.description,
        context_length=m.context_length,
        parameters=m.parameters,
        p50_latency_ms=m.p50_latency_ms,
        price_per_1k=m.price_per_1k,
        security_score=m.security_score,
        is_online=m.is_online,
        creator_id=m.creator_id,
        creator_name=m.creator.name if m.creator else "Open Source Contributor"
    )

@router.post("/{model_id}/stream")
async def stream_model_inference(
    model_id: str,
    req: ModelInferenceRequest,
    db: AsyncSession = Depends(get_db)
):
    """Zero-latency SSE token stream with real-time per-token metering & 80/20 creator revenue distribution."""
    result = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = result.scalars().first()
    repo_id = model.repo_id if model else "meta-llama/Meta-Llama-3-8B-Instruct"
    price_per_1k = model.price_per_1k if model else 0.12
    
    async def sse_metered_stream():
        token_count = 0
        async for chunk in hf_service.stream_inference(repo_id=repo_id, model_id=model_id, prompt=req.prompt):
            token_count += 1
            yield f"data: {json.dumps(chunk)}\n\n"
            
        # Post-stream settlement in ledger
        if req.user_id:
            cost = round((token_count / 1000.0) * price_per_1k, 4)
            async with AsyncSessionLocal() as session:
                await ledger_service.record_inference_metering(
                    db=session,
                    user_id=req.user_id,
                    model_id=model_id,
                    tokens=token_count,
                    cost_credits=cost
                )
            
    return StreamingResponse(sse_metered_stream(), media_type="text/event-stream")