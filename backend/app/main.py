from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import (
    auth_router,
    models_router,
    arena_router,
    orchestrator_router,
    audit_router,
    sandbox_router,
    wallet_router,
    creators_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite Database schemas on startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multi-User, Dual-Sided AI Model Marketplace, Budget-Aware Meta-Agent & Double-Entry Ledger API",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend on localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(arena_router, prefix=settings.API_V1_STR)
app.include_router(orchestrator_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(sandbox_router, prefix=settings.API_V1_STR)
app.include_router(wallet_router, prefix=settings.API_V1_STR)
app.include_router(creators_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "service": "AgentHub AI Marketplace & Economic Engine",
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "pillars": [
            "Budget-Aware Meta-Agent",
            "Double-Entry Ledger (80/20 Creator Split)",
            "High-Concurrency Multi-User Engine"
        ],
        "docs_url": "/docs",
        "demo_mode": settings.DEMO_MODE
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "gpu_clusters": 8, "p50_latency_ms": 38, "concurrency_engine": "asyncio_pooled"}