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

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Validates either JWT bearer token OR API key (ak_live_...) and returns authenticated User with Wallet.
    """
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token or API key required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials

    # 1. API Key authentication flow (e.g. ak_live_...)
    if token.startswith("ak_live_") or len(token) >= 32 and not token.count(".") == 2:
        hashed = hashlib.sha256(token.encode()).hexdigest()
        key_res = await db.execute(
            select(ApiKey).filter(
                (ApiKey.hashed_key == hashed) | (ApiKey.key_prefix == token[:12]),
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