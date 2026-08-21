import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Wallet, LedgerTransaction
from app.schemas import WalletResponse, TopupRequest, CheckoutRequest, CheckoutResponse, LedgerTransactionResponse
from app.services.ledger_service import ledger_service

router = APIRouter(prefix="/wallet", tags=["Wallet & Double-Entry Ledger"])

@router.get("/balance/{user_id}", response_model=WalletResponse)
async def get_wallet_balance(user_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Wallet).filter(Wallet.user_id == user_id))
    wallet = res.scalars().first()
    if not wallet:
        return WalletResponse(
            user_id=user_id,
            balance_credits=500.0,
            total_spent=0.0,
            updated_at=datetime.datetime.utcnow()
        )
    return WalletResponse(
        user_id=wallet.user_id,
        balance_credits=wallet.balance_credits,
        total_spent=wallet.total_spent,
        updated_at=wallet.updated_at
    )

@router.post("/checkout", response_model=CheckoutResponse)
async def checkout_credits(req: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Simulated payment gateway checkout adding credit packages to user wallet with ledger recording."""
    tx = await ledger_service.process_checkout(
        db=db,
        user_id=req.user_id,
        credits_package=req.credits_package,
        card_last4=req.card_last4 or "4242"
    )
    
    w_res = await db.execute(select(Wallet).filter(Wallet.user_id == req.user_id))
    wallet = w_res.scalars().first()
    new_bal = wallet.balance_credits if wallet else float(req.credits_package)
    
    return CheckoutResponse(
        transaction_id=tx.id,
        user_id=req.user_id,
        credits_added=req.credits_package,
        amount_usd=round(req.credits_package * 0.01, 2),
        new_balance_credits=new_bal,
        status="COMPLETED",
        created_at=tx.created_at
    )

@router.get("/ledger/{user_id}", response_model=List[LedgerTransactionResponse])
async def get_user_ledger(user_id: str, db: AsyncSession = Depends(get_db)):
    """Returns immutable double-entry ledger audit trail for a user."""
    res = await db.execute(
        select(LedgerTransaction)
        .filter(LedgerTransaction.user_id == user_id)
        .order_by(LedgerTransaction.created_at.desc())
    )
    return res.scalars().all()