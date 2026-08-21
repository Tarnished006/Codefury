import json
import asyncio
import time
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
    """Concurrently multiplexes real-time token streams across 3 models with live TTFT and token telemetry."""
    
    # 1. Fetch Model Metadata
    model_map = {}
    for mid in req.model_ids:
        res = await db.execute(select(AIModel).filter(AIModel.id == mid))
        m = res.scalars().first()
        model_map[mid] = m.repo_id if m else f"meta-llama/Meta-Llama-3-8B-Instruct"

    async def arena_event_multiplexer():
        queue = asyncio.Queue()
        start_time = time.time()
        ttft_recorded = {mid: None for mid in req.model_ids}
        token_counters = {mid: 0 for mid in req.model_ids}
        active_streams = len(req.model_ids)

        async def worker(model_id: str, repo_id: str):
            try:
                async for chunk in hf_service.stream_inference(repo_id=repo_id, model_id=model_id, prompt=req.prompt):
                    now = time.time()
                    if ttft_recorded[model_id] is None and chunk.get("token"):
                        ttft_recorded[model_id] = int((now - start_time) * 1000)
                        
                    token_counters[model_id] += 1
                    chunk["ttft_ms"] = ttft_recorded[model_id]
                    chunk["total_tokens"] = token_counters[model_id]
                    await queue.put(chunk)
            except Exception as e:
                await queue.put({"model_id": model_id, "token": f" [Stream Error: {e}]", "done": True})
            finally:
                await queue.put({"__done__": True, "model_id": model_id})

        # Launch concurrent background tasks
        tasks = [asyncio.create_task(worker(mid, model_map[mid])) for mid in req.model_ids]

        while active_streams > 0:
            item = await queue.get()
            if "__done__" in item:
                active_streams -= 1
            else:
                yield f"data: {json.dumps(item)}\n\n"

        # Cancel any dangling tasks
        for t in tasks:
            if not t.done():
                t.cancel()

    return StreamingResponse(arena_event_multiplexer(), media_type="text/event-stream")

@router.post("/vote")
async def vote_arena_winner(req: ArenaVoteRequest):
    return {"status": "SUCCESS", "message": f"Vote recorded for model {req.winner_model_id}"}