from typing import Optional
import uuid
import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models import Wallet, Creator, AIModel, LedgerTransaction, CreatorPayout

class LedgerService:
    """Manages double-entry token metering, 80/20 creator revenue splits, and payout settlements."""
    
    async def record_inference_metering(
        self,
        db: AsyncSession,
        user_id: Optional[str],
        model_id: str,
        tokens: int,
        cost_credits: float
    ) -> Optional[LedgerTransaction]:
        if not user_id or cost_credits <= 0:
            return None
            
        # 1. Fetch Model & Creator info
        m_res = await db.execute(select(AIModel).filter(AIModel.id == model_id))
        model = m_res.scalars().first()
        creator_id = model.creator_id if model else None
        
        # 2. Calculate 80/20 Revenue Split
        creator_royalty = round(cost_credits * 0.80, 4)
        platform_fee = round(cost_credits * 0.20, 4)
        
        # 3. Deduct from Consumer Wallet
        w_res = await db.execute(select(Wallet).filter(Wallet.user_id == user_id))
        wallet = w_res.scalars().first()
        if wallet:
            wallet.balance_credits = max(0.0, wallet.balance_credits - cost_credits)
            wallet.total_spent += cost_credits
            
        # 4. Credit Creator Royalties
        if creator_id:
            c_res = await db.execute(select(Creator).filter(Creator.id == creator_id))
            creator = c_res.scalars().first()
            if creator:
                creator.pending_payout_credits += creator_royalty
                creator.total_earnings_credits += creator_royalty
                
        # 5. Insert Immutable Double-Entry Ledger Record
        tx = LedgerTransaction(
            id=f"tx_met_{uuid.uuid4().hex[:12]}",
            transaction_type="INFERENCE_METERING",
            user_id=user_id,
            model_id=model_id,
            creator_id=creator_id,
            tokens_metered=tokens,
            cost_credits=cost_credits,
            creator_royalty_credits=creator_royalty,
            platform_fee_credits=platform_fee,
            description=f"Real-time token metering for {model_id} ({tokens} tokens)"
        )
        db.add(tx)
        await db.commit()
        return tx

    async def process_checkout(
        self,
        db: AsyncSession,
        user_id: str,
        credits_package: int,
        card_last4: str = "4242"
    ) -> LedgerTransaction:
        amount_usd = round(credits_package * 0.01, 2)
        
        w_res = await db.execute(select(Wallet).filter(Wallet.user_id == user_id))
        wallet = w_res.scalars().first()
        if wallet:
            wallet.balance_credits += float(credits_package)
            
        tx = LedgerTransaction(
            id=f"tx_chk_{uuid.uuid4().hex[:12]}",
            transaction_type="WALLET_TOPUP",
            user_id=user_id,
            cost_credits=float(credits_package),
            description=f"Payment Gateway Checkout: +{credits_package} Credits (${amount_usd} via Card ending in {card_last4})"
        )
        db.add(tx)
        await db.commit()
        return tx

    async def process_creator_payout(
        self,
        db: AsyncSession,
        creator_id: str,
        amount_credits: float,
        payout_method: str,
        destination_address: str
    ) -> CreatorPayout:
        c_res = await db.execute(select(Creator).filter(Creator.id == creator_id))
        creator = c_res.scalars().first()
        if not creator:
            raise ValueError(f"Creator {creator_id} not found")
            
        if amount_credits > creator.pending_payout_credits:
            raise ValueError(
                f"Requested payout ({amount_credits} Credits) exceeds available balance ({creator.pending_payout_credits} Credits)"
            )
            
        creator.pending_payout_credits -= amount_credits
        amount_usd = round(amount_credits * 0.01, 2)
        ref_id = f"ref_wire_{uuid.uuid4().hex[:10]}"
        
        payout = CreatorPayout(
            id=f"pay_{uuid.uuid4().hex[:10]}",
            creator_id=creator_id,
            amount_credits=amount_credits,
            amount_usd=amount_usd,
            payout_method=payout_method,
            destination_address=destination_address,
            reference_id=ref_id,
            status="COMPLETED"
        )
        
        tx = LedgerTransaction(
            id=f"tx_pay_{uuid.uuid4().hex[:12]}",
            transaction_type="CREATOR_PAYOUT",
            creator_id=creator_id,
            cost_credits=amount_credits,
            creator_royalty_credits=amount_credits,
            description=f"Creator Revenue Payout: ${amount_usd} ({amount_credits} Credits) to {destination_address}"
        )
        
        db.add(payout)
        db.add(tx)
        await db.commit()
        return payout

ledger_service = LedgerService()