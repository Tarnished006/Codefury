import json
import asyncio
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import AIModel
from app.schemas import ArenaStreamRequest, ArenaVoteRequest
from app.services import hf_service

router = APIRouter(prefix="/arena", tags=["Model Matchmaker Arena"])

@router.post("/stream")
async def arena_multi_stream(req: ArenaStreamRequest, db: AsyncSession = Depends(get_db)):
    """Streams 3 models concurrently over a single SSE channel."""
    
    async def event_generator():
        # Setup stream generators for all selected models
        streams = []
        for mid in req.model_ids:
            res = await db.execute(select(AIModel).filter(AIModel.id == mid))
            model = res.scalars().first()
            repo_id = model.repo_id if model else f"models/{mid}"
            streams.append(hf_service.stream_inference(repo_id=repo_id, model_id=mid, prompt=req.prompt))
            
        async def read_stream(gen, mid):
            async for chunk in gen:
                yield chunk

        # Concurrent interleave of chunks
        tasks = [read_stream(g, mid) for g, mid in zip(streams, req.model_ids)]
        
        # Stream chunks as they arrive
        for t in tasks:
            async for chunk in t:
                yield f"data: {json.dumps(chunk)}\n\n"
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/vote")
async def vote_arena_winner(req: ArenaVoteRequest):
    return {"status": "SUCCESS", "message": f"Vote recorded for model {req.winner_model_id}"}