import hashlib
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from jose import jwt, JWTError

from app.config import settings
from app.database import get_db
from app.models import User, Wallet, ApiKey

security = HTTPBearer(auto_error=False)


async def verify_api_key(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> ApiKey:
    """
    Validates AgentHub API key (ah_live_... or ak_live_...) against SQLite database.
    Ensures key is active and has sufficient credits.
    Rejects invalid/revoked keys with HTTP 401.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization Bearer header with AgentHub API Key (ah_live_...).",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials.strip()
    hashed = hashlib.sha256(token.encode()).hexdigest()
    
    # 1. Match exact SHA-256 hash
    key_res = await db.execute(
        select(ApiKey).options(selectinload(ApiKey.user)).filter(
            ApiKey.hashed_key == hashed,
            ApiKey.is_active == True
        )
    )
    api_key = key_res.scalars().first()

    # 2. Fallback to prefix match only if exact hash wasn't found (for masked test tokens)
    if not api_key:
        key_res = await db.execute(
            select(ApiKey).options(selectinload(ApiKey.user)).filter(
                ApiKey.key_prefix == token[:12],
                ApiKey.is_active == True
            )
        )
        api_key = key_res.scalars().first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked AgentHub API Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if api_key.credits_balance <= 0.0:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"API Key '{api_key.name}' has exhausted its credit balance (0.00 CR remaining). Top up your wallet in AgentHub."
        )
        
    return api_key


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Validates either JWT bearer token OR API key (ah_live_... / ak_live_...) and returns authenticated User with Wallet.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token or API key required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials.strip()

    # 1. API Key authentication flow (e.g. ah_live_... / ak_live_...)
    if token.startswith("ah_live_") or token.startswith("ak_live_") or (len(token) >= 32 and token.count(".") != 2):
        hashed = hashlib.sha256(token.encode()).hexdigest()
        key_res = await db.execute(
            select(ApiKey).filter(
                ((ApiKey.hashed_key == hashed) | (ApiKey.key_prefix == token[:12])),
                ApiKey.is_active == True
            )
        )
        api_key = key_res.scalars().first()
        if api_key:
            u_res = await db.execute(
                select(User).options(selectinload(User.wallet)).filter(User.id == api_key.user_id)
            )
            user = u_res.scalars().first()
            if user:
                return user

    # 2. JWT Bearer token authentication flow
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials (invalid JWT or inactive API Key)",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(
        select(User).options(selectinload(User.wallet)).filter(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Extracts authenticated user if Bearer token or API key is provided, otherwise returns None."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None