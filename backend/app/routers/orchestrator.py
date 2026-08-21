from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Wallet
from app.schemas import OrchestrateRequest, OrchestrationResponse
from app.services.orchestrator_engine import orchestrator_engine

router = APIRouter(prefix="/orchestrate", tags=["Budget-Aware Meta-Agent"])


@router.post("", response_model=OrchestrationResponse)
async def orchestrate_task(req: OrchestrateRequest, db: AsyncSession = Depends(get_db)):
    """
    Decomposes natural language intent into a live autonomous DAG plan.
    - Supervisor: openai/gpt-oss-120b (Groq) reads the full live model catalog from DB
      and selects the most suitable specialist models for each sub-task.
    - Executor: llama-3.3-70b-versatile runs each step with domain-appropriate system prompts.
    - Final synthesis: Groq unifies all step outputs into a coherent final answer.
    """
    balance = 500.0
    if req.user_id:
        w_res = await db.execute(select(Wallet).filter(Wallet.user_id == req.user_id))
        wallet = w_res.scalars().first()
        if wallet:
            balance = wallet.balance_credits

    return await orchestrator_engine.orchestrate_intent(
        goal=req.goal,
        user_balance=balance,
        max_budget_credits=req.max_budget_credits,
        db=db,
    )