from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Creator, AIModel
from app.schemas import CreatorResponse, PayoutRequest, PayoutResponse
from app.services.ledger_service import ledger_service

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
async def request_creator_payout(req: PayoutRequest, db: AsyncSession = Depends(get_db)):
    """Simulates fiat bank transfer or crypto USDC withdrawal for model creators."""
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