import uuid
import datetime
import bcrypt
import hashlib
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models import User, Wallet, ApiKey, PurchasedModel, TestedModel, LedgerTransaction, Creator
from app.schemas import (
    UserCreate,
    UserLogin,
    Token,
    UserResponse,
    UserUpdate,
    UserProfileDetailsResponse,
    PurchasedModelResponse,
    TestedModelResponse,
    LedgerTransactionResponse,
    ApiKeyResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Strict Authentication & JWT"])

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))
    except Exception:
        # Fallback check for legacy seeded sha256 hashes
        salt = "agenthub_salt_2026"
        legacy_hash = hashlib.sha256((plain_password + salt).encode("utf-8")).hexdigest()
        return legacy_hash == hashed_password

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user, provisions starting wallet with 500 credits, and returns JWT."""
    result = await db.execute(
        select(User).filter((User.email == user_in.email) | (User.handle == user_in.handle))
    )
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email or handle is already registered")
        
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    role = user_in.role or "developer"
    new_user = User(
        id=user_id,
        email=user_in.email,
        handle=user_in.handle,
        hashed_password=hash_password(user_in.password),
        role=role
    )
    new_wallet = Wallet(
        id=f"wal_{uuid.uuid4().hex[:10]}",
        user_id=user_id,
        balance_credits=500.0
    )
    db.add(new_user)
    db.add(new_wallet)

    creator_id = None
    if role == "creator":
        creator_id = f"creator_{uuid.uuid4().hex[:10]}"
        new_creator = Creator(
            id=creator_id,
            name=user_in.handle,
            handle=user_in.handle,
            bio="Independent AI Creator on AgentNet",
            user_id=user_id,
            total_earnings_credits=0.0,
            pending_payout_credits=0.0
        )
        db.add(new_creator)

    await db.commit()
    
    token = create_access_token({"sub": user_id, "email": user_in.email, "role": role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_in.email,
            "handle": user_in.handle,
            "role": role,
            "credits": 500.0,
            "creator_id": creator_id
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticates credentials with bcrypt verification, returning JWT and wallet state."""
    result = await db.execute(
        select(User).options(selectinload(User.wallet), selectinload(User.creator)).filter(User.email == credentials.email)
    )
    user = result.scalars().first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    credits = user.wallet.balance_credits if user.wallet else 500.0
    creator_id = user.creator.id if user.creator else None
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "handle": user.handle,
            "role": user.role,
            "credits": credits,
            "creator_id": creator_id
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns the authenticated user's profile and live wallet balance."""
    u_res = await db.execute(
        select(User).options(selectinload(User.wallet), selectinload(User.creator)).filter(User.id == current_user.id)
    )
    user = u_res.scalars().first() or current_user
    credits = user.wallet.balance_credits if user.wallet else 500.0
    creator_id = user.creator.id if user.creator else None
    return UserResponse(
        id=user.id,
        email=user.email,
        handle=user.handle,
        role=user.role,
        credits=credits,
        created_at=user.created_at,
        creator_id=creator_id
    )

@router.post("/convert-to-creator", response_model=UserResponse)
async def convert_to_creator(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upgrades the authenticated user to Creator status and initializes Creator record."""
    res = await db.execute(
        select(User).options(selectinload(User.creator), selectinload(User.wallet)).filter(User.id == current_user.id)
    )
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not user.creator:
        creator_id = f"creator_{uuid.uuid4().hex[:10]}"
        new_creator = Creator(
            id=creator_id,
            name=user.handle,
            handle=user.handle,
            bio="Independent AI Creator on AgentNet",
            user_id=user.id,
            total_earnings_credits=0.0,
            pending_payout_credits=0.0
        )
        db.add(new_creator)
        
    user.role = "creator"
    db.add(user)
    await db.commit()
    
    res = await db.execute(
        select(User).options(selectinload(User.creator), selectinload(User.wallet)).filter(User.id == current_user.id)
    )
    user = res.scalars().first()
    credits = user.wallet.balance_credits if user.wallet else 500.0
    
    return UserResponse(
        id=user.id,
        email=user.email,
        handle=user.handle,
        role=user.role,
        credits=credits,
        created_at=user.created_at,
        creator_id=user.creator.id if user.creator else None
    )

@router.get("/profile-details", response_model=UserProfileDetailsResponse)
async def get_user_profile_details(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Returns detailed user metrics, purchased models, tested models, API keys, and ledger transactions."""
    result = await db.execute(
        select(User)
        .options(
            selectinload(User.wallet),
            selectinload(User.api_keys),
            selectinload(User.purchased_models).selectinload(PurchasedModel.model),
            selectinload(User.tested_models).selectinload(TestedModel.model),
            selectinload(User.transactions),
            selectinload(User.creator)
        )
        .filter(User.id == current_user.id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    balance = user.wallet.balance_credits if user.wallet else 500.0
    spent = user.wallet.total_spent if user.wallet else 0.0
    total_tokens = sum(t.tokens_metered for t in user.transactions if t.transaction_type == "INFERENCE_METERING")
    
    api_keys = [
        ApiKeyResponse(
            id=k.id,
            name=k.name,
            api_key=f"sk_live_...{k.key_prefix}",
            created_at=k.created_at
        )
        for k in user.api_keys
    ]
    
    purchased = [
        PurchasedModelResponse(
            id=pm.id,
            model_id=pm.model_id,
            model_name=pm.model.name if pm.model else pm.model_id,
            price_paid=pm.price_paid,
            purchased_at=pm.purchased_at
        )
        for pm in user.purchased_models
    ]
    
    tested = [
        TestedModelResponse(
            id=tm.id,
            model_id=tm.model_id,
            model_name=tm.model.name if tm.model else tm.model_id,
            tested_at=tm.tested_at,
            test_details=tm.test_details
        )
        for tm in user.tested_models
    ]
    
    ecommerce_history = [
        LedgerTransactionResponse(
            id=tx.id,
            transaction_type=tx.transaction_type,
            user_id=tx.user_id,
            model_id=tx.model_id,
            creator_id=tx.creator_id,
            tokens_metered=tx.tokens_metered,
            cost_credits=tx.cost_credits,
            creator_royalty_credits=tx.creator_royalty_credits,
            platform_fee_credits=tx.platform_fee_credits,
            description=tx.description,
            created_at=tx.created_at
        )
        for tx in sorted(user.transactions, key=lambda x: x.created_at, reverse=True)
    ]
    
    return UserProfileDetailsResponse(
        id=user.id,
        email=user.email,
        handle=user.handle,
        role=user.role,
        created_at=user.created_at,
        balance_credits=balance,
        total_spent=spent,
        total_tokens_used=total_tokens,
        api_keys=api_keys,
        purchased_models=purchased,
        tested_models=tested,
        ecommerce_history=ecommerce_history,
        creator_id=user.creator.id if user.creator else None
    )

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    update_in: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates user handle, email, or password."""
    if update_in.handle and update_in.handle != current_user.handle:
        res = await db.execute(select(User).filter(User.handle == update_in.handle))
        if res.scalars().first():
            raise HTTPException(status_code=400, detail="Handle already taken")
        current_user.handle = update_in.handle
        
    if update_in.email and update_in.email != current_user.email:
        res = await db.execute(select(User).filter(User.email == update_in.email))
        if res.scalars().first():
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = update_in.email
        
    if update_in.password:
        current_user.hashed_password = hash_password(update_in.password)
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    # Force reload of wallet to avoid lazy load issue
    result = await db.execute(
        select(User).options(selectinload(User.wallet)).filter(User.id == current_user.id)
    )
    current_user = result.scalars().first()
    credits = current_user.wallet.balance_credits if current_user.wallet else 500.0
    
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        handle=current_user.handle,
        role=current_user.role,
        credits=credits,
        created_at=current_user.created_at
    )