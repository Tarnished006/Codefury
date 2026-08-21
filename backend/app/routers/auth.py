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
from app.models import User, Wallet
from app.schemas import UserCreate, UserLogin, Token, UserResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & JWT"])

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
    new_user = User(
        id=user_id,
        email=user_in.email,
        handle=user_in.handle,
        hashed_password=hash_password(user_in.password),
        role="consumer"
    )
    new_wallet = Wallet(
        id=f"wal_{uuid.uuid4().hex[:10]}",
        user_id=user_id,
        balance_credits=500.0
    )
    db.add(new_user)
    db.add(new_wallet)
    await db.commit()
    
    token = create_access_token({"sub": user_id, "email": user_in.email, "role": "consumer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": user_in.email,
            "handle": user_in.handle,
            "role": "consumer",
            "credits": 500.0
        }
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticates credentials with bcrypt verification, returning JWT and wallet state."""
    result = await db.execute(
        select(User).options(selectinload(User.wallet)).filter(User.email == credentials.email)
    )
    user = result.scalars().first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    credits = user.wallet.balance_credits if user.wallet else 500.0
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "handle": user.handle,
            "role": user.role,
            "credits": credits
        }
    }

@router.post("/guest-demo", response_model=Token)
async def guest_demo_login(db: AsyncSession = Depends(get_db)):
    """Instant 1-Click Guest Demo Bypass for judges preloaded with 500 test credits and valid JWT."""
    guest_id = f"usr_guest_{uuid.uuid4().hex[:6]}"
    guest_email = f"{guest_id}@agenthub.demo"
    guest_handle = f"judge_{guest_id[-4:]}"
    
    new_user = User(
        id=guest_id,
        email=guest_email,
        handle=guest_handle,
        hashed_password=hash_password("demo_session_secret"),
        role="consumer"
    )
    new_wallet = Wallet(
        id=f"wal_{uuid.uuid4().hex[:10]}",
        user_id=guest_id,
        balance_credits=500.0
    )
    db.add(new_user)
    db.add(new_wallet)
    await db.commit()
    
    token = create_access_token({"sub": guest_id, "email": guest_email, "role": "consumer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": guest_id,
            "email": guest_email,
            "handle": guest_handle,
            "role": "consumer",
            "credits": 500.0
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user's profile and live wallet balance."""
    credits = current_user.wallet.balance_credits if current_user.wallet else 500.0
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        handle=current_user.handle,
        role=current_user.role,
        credits=credits,
        created_at=current_user.created_at
    )