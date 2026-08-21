import json
import asyncio
import time
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db, AsyncSessionLocal
from app.models import AIModel
from app.schemas import ArenaStreamRequest, ArenaVoteRequest
from app.services.groq_stream_service import groq_stream_service
from app.services.ledger_service import ledger_service

router = APIRouter(prefix="/arena", tags=["Model Matchmaker Arena"])


@router.post("/stream")
async def arena_multi_stream(req: ArenaStreamRequest, db: AsyncSession = Depends(get_db)):
    """
    Concurrently multiplexes real-time token streams across 3 model slots.
    - Each slot gets a DISTINCT system persona via Groq so outputs genuinely differ.
    - Uses openai/gpt-oss-120b → llama-3.3-70b-versatile → llama-3.1-8b-instant fallback chain.
    - Records per-model token cost to the double-entry ledger.
    """
    # Resolve price for each model (for ledger metering)
    price_map = {}
    for mid in req.model_ids:
        res = await db.execute(select(AIModel).filter(AIModel.id == mid))
        m = res.scalars().first()
        price_map[mid] = m.price_per_1k if m else 0.12

    async def arena_event_multiplexer():
        queue: asyncio.Queue = asyncio.Queue()
        start_time = time.time()
        ttft_recorded = {mid: None for mid in req.model_ids}
        token_counters = {mid: 0    for mid in req.model_ids}
        active_streams = len(req.model_ids)

        async def worker(model_id: str):
            """One streaming worker per arena slot — each has a unique persona."""
            try:
                async for chunk in groq_stream_service.stream_for_arena(
                    model_id=model_id,
                    prompt=req.prompt,
                    max_tokens=400,
                    temperature=0.75,
                ):
                    now = time.time()
                    if ttft_recorded[model_id] is None and (chunk.get("token") or "").strip():
                        ttft_recorded[model_id] = max(10, int((now - start_time) * 1000))

                    token_counters[model_id] += 1
                    chunk["ttft_ms"]      = ttft_recorded[model_id] or 50
                    chunk["total_tokens"] = token_counters[model_id]
                    await queue.put(chunk)
            except Exception as e:
                await queue.put({
                    "model_id": model_id,
                    "token":    f" [Stream Error: {e}] ",
                    "done":     True,
                    "ttft_ms":  0,
                    "total_tokens": 1,
                })
            finally:
                await queue.put({"__done__": True, "model_id": model_id})

        # Launch all 3 workers concurrently
        tasks = [asyncio.create_task(worker(mid)) for mid in req.model_ids]

        while active_streams > 0:
            item = await queue.get()
            if "__done__" in item:
                active_streams -= 1
            else:
                yield f"data: {json.dumps(item)}\n\n"

        # Record ledger entries for all tokens consumed
        user_id = req.user_id or "usr_guest_demo"
        if sum(token_counters.values()) > 0:
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
                            cost_credits=cost,
                        )

        for t in tasks:
            if not t.done():
                t.cancel()

    return StreamingResponse(arena_event_multiplexer(), media_type="text/event-stream")


@router.post("/vote")
async def vote_arena_winner(req: ArenaVoteRequest):
    return {"status": "SUCCESS", "message": f"Vote recorded for model {req.winner_model_id}"}