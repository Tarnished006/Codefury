from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Wallet
from app.schemas import OrchestrateRequest, OrchestrationResponse
from app.services import orchestrator_engine

router = APIRouter(prefix="/orchestrate", tags=["Budget-Aware Meta-Agent"])

@router.post("", response_model=OrchestrationResponse)
async def orchestrate_task(req: OrchestrateRequest, db: AsyncSession = Depends(get_db)):
    """Decomposes natural language intent into an autonomous DAG plan, adapting steps to user liquidity."""
    balance = 500.0
    if req.user_id:
        w_res = await db.execute(select(Wallet).filter(Wallet.user_id == req.user_id))
        wallet = w_res.scalars().first()
        if wallet:
            balance = wallet.balance_credits
            
    return await orchestrator_engine.orchestrate_intent(
        goal=req.goal,
        user_balance=balance,
        max_budget_credits=req.max_budget_credits
    )