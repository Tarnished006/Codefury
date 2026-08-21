import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import Wallet
from app.schemas import WalletResponse, TopupRequest

router = APIRouter(prefix="/wallet", tags=["Wallet & Credits"])

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

@router.post("/topup/{user_id}", response_model=WalletResponse)
async def topup_credits(user_id: str, req: TopupRequest, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Wallet).filter(Wallet.user_id == user_id))
    wallet = res.scalars().first()
    if wallet:
        wallet.balance_credits += req.amount_credits
        await db.commit()
        await db.refresh(wallet)
        return WalletResponse(
            user_id=wallet.user_id,
            balance_credits=wallet.balance_credits,
            total_spent=wallet.total_spent,
            updated_at=wallet.updated_at
        )
    return WalletResponse(
        user_id=user_id,
        balance_credits=500.0 + req.amount_credits,
        total_spent=0.0,
        updated_at=datetime.datetime.utcnow()
    )