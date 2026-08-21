import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import AIModel
from app.schemas import AIModelResponse, ModelInferenceRequest
from app.services import hf_service

router = APIRouter(prefix="/models", tags=["AI Models"])

@router.get("", response_model=List[AIModelResponse])
async def list_models(domain: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(AIModel)
    if domain and domain != "ALL_DOMAINS":
        query = query.filter(AIModel.domain == domain)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{model_id}", response_model=AIModelResponse)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = result.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model

@router.post("/{model_id}/stream")
async def stream_model_inference(
    model_id: str,
    req: ModelInferenceRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = result.scalars().first()
    repo_id = model.repo_id if model else "meta-llama/Meta-Llama-3-8B-Instruct"
    
    async def sse_event_stream():
        async for chunk in hf_service.stream_inference(repo_id=repo_id, model_id=model_id, prompt=req.prompt):
            yield f"data: {json.dumps(chunk)}\n\n"
            
    return StreamingResponse(sse_event_stream(), media_type="text/event-stream")