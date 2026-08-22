from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Creator, AIModel, User, LedgerTransaction
from app.schemas import (
    CreatorResponse, 
    PayoutRequest, 
    PayoutResponse, 
    CreatorProfileResponse, 
    CreatorTransactionResponse,
    AIModelResponse
)
from app.services.ledger_service import ledger_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/creators", tags=["Dual-Sided Marketplace & Creators"])

@router.get("", response_model=List[CreatorResponse])
async def list_creators(db: AsyncSession = Depends(get_db)):
    """Lists all model creators with their published model counts and lifetime earnings."""
    result = await db.execute(select(Creator).options(selectinload(Creator.models)))
    creators = result.scalars().all()
    
    return [
        CreatorResponse(
            id=c.id,
            name=c.name,
            handle=c.handle,
            bio=c.bio,
            avatar_url=c.avatar_url,
            total_earnings_credits=c.total_earnings_credits,
            pending_payout_credits=c.pending_payout_credits,
            models_count=len(c.models),
            created_at=c.created_at
        )
        for c in creators
    ]

@router.get("/me", response_model=CreatorProfileResponse)
async def get_my_creator_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authenticated user's creator profile."""
    result = await db.execute(
        select(Creator)
        .options(selectinload(Creator.models))
        .filter(Creator.user_id == current_user.id)
    )
    creator = result.scalars().first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
        
    return CreatorProfileResponse(
        id=creator.id,
        name=creator.name,
        handle=creator.handle,
        bio=creator.bio,
        avatar_url=creator.avatar_url,
        total_earnings_credits=creator.total_earnings_credits,
        pending_payout_credits=creator.pending_payout_credits,
        pending_payout_usd=round(creator.pending_payout_credits * 0.01, 2),
        lifetime_earnings_usd=round(creator.total_earnings_credits * 0.01, 2),
        models_count=len(creator.models),
        payout_status="READY" if creator.pending_payout_credits >= 10.0 else "MIN_THRESHOLD_NOT_MET",
        revenue_split_percent="80% Creator / 20% Platform Treasury",
        created_at=creator.created_at
    )

@router.get("/me/models", response_model=List[AIModelResponse])
async def get_my_models(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authenticated creator's published models."""
    result = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = result.scalars().first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
        
    result_models = await db.execute(
        select(AIModel)
        .options(selectinload(AIModel.creator))
        .filter(AIModel.creator_id == creator.id)
    )
    models = result_models.scalars().all()
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
            purchase_price=m.purchase_price,
            security_score=m.security_score,
            is_online=m.is_online,
            creator_id=m.creator_id,
            creator_name=m.creator.name if m.creator else "Open Source Contributor"
        )
        for m in models
    ]

@router.get("/me/transactions", response_model=List[CreatorTransactionResponse])
async def get_my_transactions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns authenticated creator's earnings transaction history."""
    result = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = result.scalars().first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
        
    result_txs = await db.execute(
        select(LedgerTransaction)
        .options(selectinload(LedgerTransaction.model))
        .filter(LedgerTransaction.creator_id == creator.id)
        .order_by(LedgerTransaction.created_at.desc())
    )
    txs = result_txs.scalars().all()
    return [
        CreatorTransactionResponse(
            id=t.id,
            transaction_type=t.transaction_type,
            model_id=t.model_id,
            model_name=t.model.name if t.model else None,
            tokens_metered=t.tokens_metered,
            cost_credits=t.cost_credits,
            creator_royalty_credits=t.creator_royalty_credits,
            description=t.description,
            created_at=t.created_at
        )
        for t in txs
    ]

@router.get("/{creator_id}/earnings")
async def get_creator_earnings(creator_id: str, db: AsyncSession = Depends(get_db)):
    """Returns real-time royalty earnings, pending payout balance, and revenue share breakdown (80/20)."""
    result = await db.execute(select(Creator).filter(Creator.id == creator_id))
    creator = result.scalars().first()
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
        
    return {
        "creator_id": creator.id,
        "name": creator.name,
        "handle": creator.handle,
        "pending_payout_credits": creator.pending_payout_credits,
        "pending_payout_usd": round(creator.pending_payout_credits * 0.01, 2),
        "lifetime_earnings_credits": creator.total_earnings_credits,
        "lifetime_earnings_usd": round(creator.total_earnings_credits * 0.01, 2),
        "revenue_split_percent": "80% Creator / 20% Platform Treasury",
        "payout_status": "READY" if creator.pending_payout_credits >= 10.0 else "MIN_THRESHOLD_NOT_MET"
    }

@router.post("/payout", response_model=PayoutResponse)
async def request_creator_payout(
    req: PayoutRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Simulates fiat bank transfer or crypto USDC withdrawal for model creators."""
    c_res = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = c_res.scalars().first()
    if not creator or creator.id != req.creator_id:
        raise HTTPException(status_code=403, detail="Unauthorized payout request: creator mismatch")
        
    try:
        payout = await ledger_service.process_creator_payout(
            db=db,
            creator_id=req.creator_id,
            amount_credits=req.amount_credits,
            payout_method=req.payout_method,
            destination_address=req.destination_address
        )
        
        c_res = await db.execute(select(Creator).filter(Creator.id == req.creator_id))
        creator = c_res.scalars().first()
        rem_balance = creator.pending_payout_credits if creator else 0.0
        
        return PayoutResponse(
            payout_id=payout.id,
            creator_id=payout.creator_id,
            amount_credits=payout.amount_credits,
            amount_usd=payout.amount_usd,
            payout_method=payout.payout_method,
            destination_address=payout.destination_address,
            reference_id=payout.reference_id,
            status=payout.status,
            remaining_balance_credits=rem_balance,
            created_at=payout.created_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))