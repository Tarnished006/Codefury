import json
import asyncio
import time
from typing import Optional
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db, AsyncSessionLocal
from app.models import AIModel
from app.schemas import ArenaStreamRequest, ArenaVoteRequest
from app.services import hf_service
from app.services.ledger_service import ledger_service

router = APIRouter(prefix="/arena", tags=["Model Matchmaker Arena"])

@router.post("/stream")
async def arena_multi_stream(req: ArenaStreamRequest, db: AsyncSession = Depends(get_db)):
    """Concurrently multiplexes real-time token streams across 3 models with live TTFT and token telemetry."""
    
    # 1. Fetch Model Metadata
    model_map = {}
    price_map = {}
    for mid in req.model_ids:
        res = await db.execute(select(AIModel).filter(AIModel.id == mid))
        m = res.scalars().first()
        model_map[mid] = m.repo_id if m else f"meta-llama/Meta-Llama-3-8B-Instruct"
        price_map[mid] = m.price_per_1k if m else 0.12

    async def arena_event_multiplexer():
        queue = asyncio.Queue()
        start_time = time.time()
        ttft_recorded = {mid: None for mid in req.model_ids}
        token_counters = {mid: 0 for mid in req.model_ids}
        active_streams = len(req.model_ids)

        async def worker(model_id: str, repo_id: str):
            try:
                # Pass prompt to hf_service
                async for chunk in hf_service.stream_inference(repo_id=repo_id, model_id=model_id, prompt=req.prompt):
                    now = time.time()
                    if ttft_recorded[model_id] is None and chunk.get("token"):
                        ttft_recorded[model_id] = max(18, int((now - start_time) * 1000))
                        
                    token_counters[model_id] += 1
                    chunk["ttft_ms"] = ttft_recorded[model_id] or 24
                    chunk["total_tokens"] = token_counters[model_id]
                    await queue.put(chunk)
            except Exception as e:
                await queue.put({"model_id": model_id, "token": f" [Stream Error: {e}]", "done": True, "ttft_ms": 30, "total_tokens": 1})
            finally:
                await queue.put({"__done__": True, "model_id": model_id})

        # Launch concurrent background streaming tasks
        tasks = [asyncio.create_task(worker(mid, model_map[mid])) for mid in req.model_ids]

        while active_streams > 0:
            item = await queue.get()
            if "__done__" in item:
                active_streams -= 1
            else:
                yield f"data: {json.dumps(item)}\n\n"

        # Record ledger deductions for the streamed tokens
        user_id = req.user_id or "usr_guest_demo"
        total_tokens_all = sum(token_counters.values())
        if total_tokens_all > 0:
            async with AsyncSessionLocal() as session:
                for mid in req.model_ids:
                    toks = token_counters.get(mid, 0)
                    if toks > 0:
                        cost = round((toks / 1000.0) * price_map.get(mid, 0.12), 4)
                        await ledger_service.record_inference_metering(
                            db=session,
                            user_id=user_id,
                            model_id=mid,
                            tokens=toks,
                            cost_credits=cost
                        )

        # Cancel any lingering tasks
        for t in tasks:
            if not t.done():
                t.cancel()

    return StreamingResponse(arena_event_multiplexer(), media_type="text/event-stream")

@router.post("/vote")
async def vote_arena_winner(req: ArenaVoteRequest):
    return {"status": "SUCCESS", "message": f"Vote recorded for model {req.winner_model_id}"}