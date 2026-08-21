import uuid
import hashlib
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models import User, Wallet
from app.schemas import UserCreate, UserLogin, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    salt = "agenthub_salt_2026"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter((User.email == user_in.email) | (User.handle == user_in.handle)))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email or handle already registered")
        
    user_id = f"usr_{uuid.uuid4().hex[:10]}"
    new_user = User(
        id=user_id,
        email=user_in.email,
        handle=user_in.handle,
        hashed_password=hash_password(user_in.password),
        role="developer"
    )
    new_wallet = Wallet(
        id=f"wal_{uuid.uuid4().hex[:10]}",
        user_id=user_id,
        balance_credits=500.0
    )
    db.add(new_user)
    db.add(new_wallet)
    await db.commit()
    
    token = create_access_token({"sub": user_id, "email": user_in.email, "role": "developer"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user_id, "email": user_in.email, "handle": user_in.handle, "credits": 500.0}
    }

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).filter(User.email == credentials.email))
    user = result.scalars().first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    w_res = await db.execute(select(Wallet).filter(Wallet.user_id == user.id))
    wallet = w_res.scalars().first()
    credits = wallet.balance_credits if wallet else 500.0
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "handle": user.handle, "credits": credits}
    }

@router.post("/guest-demo", response_model=Token)
async def guest_demo_login(db: AsyncSession = Depends(get_db)):
    """Instant 1-Click Demo Session for judges preloaded with 500 test credits."""
    guest_id = f"usr_demo_{uuid.uuid4().hex[:6]}"
    guest_email = f"{guest_id}@agenthub.demo"
    
    new_user = User(
        id=guest_id,
        email=guest_email,
        handle=f"demo_dev_{guest_id[-4:]}",
        hashed_password=hash_password("demo_session_secret"),
        role="demo"
    )
    new_wallet = Wallet(
        id=f"wal_{uuid.uuid4().hex[:10]}",
        user_id=guest_id,
        balance_credits=500.0
    )
    db.add(new_user)
    db.add(new_wallet)
    await db.commit()
    
    token = create_access_token({"sub": guest_id, "email": guest_email, "role": "demo"})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": guest_id, "email": guest_email, "handle": new_user.handle, "credits": 500.0}
    }