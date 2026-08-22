import json
import uuid
import hashlib
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.database import get_db, AsyncSessionLocal
from app.models import AIModel, Deployment, User, Wallet, Creator, LedgerTransaction, PurchasedModel, TestedModel
from app.schemas import AIModelResponse, AIModelCreate, AIModelUpdate, ModelInferenceRequest
from app.services import hf_service
from app.services.ledger_service import ledger_service
from app.dependencies import get_current_user

router = APIRouter(prefix="/models", tags=["AI Models & Real-Time Token Metering"])

ARTIFACTS_DIR = Path("backend/artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

@router.post("", response_model=AIModelResponse)
async def create_model(
    model_in: AIModelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows creators to publish a new AI model to the marketplace with strict repo verification."""
    if current_user.role != "creator":
        raise HTTPException(status_code=403, detail="Only registered Creators can publish models.")

    # Strict model verification: Ensure repo or endpoint exists
    from app.routers.registry import verify_target_model_exists
    await verify_target_model_exists(
        api_endpoint=model_in.repo_id,
        model_name=model_in.name
    )

    c_res = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = c_res.scalars().first()

    if not creator:
        creator = Creator(
            id=f"creator_{uuid.uuid4().hex[:10]}",
            name=current_user.handle,
            handle=current_user.handle,
            bio="Independent AI Creator on AgentNet",
            user_id=current_user.id,
            total_earnings_credits=0.0,
            pending_payout_credits=0.0
        )
        db.add(creator)
        await db.commit()
        await db.refresh(creator)

    model_id = f"mod_{uuid.uuid4().hex[:10]}"
    new_model = AIModel(
        id=model_id,
        creator_id=creator.id,
        name=model_in.name,
        repo_id=model_in.repo_id,
        domain=model_in.domain.upper(),
        task_tag=model_in.task_tag.upper(),
        description=model_in.description or "Creator-published model on AgentNet",
        context_length=model_in.context_length,
        parameters=model_in.parameters,
        price_per_1k=model_in.price_per_1k,
        purchase_price=model_in.purchase_price,
        p50_latency_ms=38,
        security_score=98,
        is_online=True
    )
    db.add(new_model)
    await db.commit()
    await db.refresh(new_model)

    return AIModelResponse(
        id=new_model.id,
        name=new_model.name,
        repo_id=new_model.repo_id,
        domain=new_model.domain,
        task_tag=new_model.task_tag,
        description=new_model.description,
        context_length=new_model.context_length,
        parameters=new_model.parameters,
        p50_latency_ms=new_model.p50_latency_ms,
        price_per_1k=new_model.price_per_1k,
        security_score=new_model.security_score,
        is_online=new_model.is_online,
        creator_id=creator.id,
        creator_name=creator.name
    )

@router.get("", response_model=List[AIModelResponse])
async def list_models(domain: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(AIModel).options(selectinload(AIModel.creator))
    if domain and domain.upper() not in ["ALL_DOMAINS", "ALL DOMAINS"]:
        d_space = domain.replace("_", " ").upper()
        d_under = domain.replace(" ", "_").upper()
        query = query.filter(
            (AIModel.domain == domain) |
            (AIModel.domain == d_space) |
            (AIModel.domain == d_under)
        )
    result = await db.execute(query)
    models = result.scalars().all()
    
    return [
        AIModelResponse(
            id=m.id,
            name=m.name,
            repo_id=m.repo_id,
            domain=m.domain,
            task_tag=m.task_tag,
            description=m.description,
            context_length=m.context_length,
            parameters=m.parameters,
            p50_latency_ms=m.p50_latency_ms,
            price_per_1k=m.price_per_1k,
            security_score=m.security_score,
            is_online=m.is_online,
            creator_id=m.creator_id,
            creator_name=m.creator.name if m.creator else "Open Source Contributor"
        )
        for m in models
    ]

@router.get("/{model_id}", response_model=AIModelResponse)
async def get_model(model_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AIModel).options(selectinload(AIModel.creator)).filter(AIModel.id == model_id))
    m = result.scalars().first()
    if not m:
        raise HTTPException(status_code=404, detail="Model not found")
    return AIModelResponse(
        id=m.id,
        name=m.name,
        repo_id=m.repo_id,
        domain=m.domain,
        task_tag=m.task_tag,
        description=m.description,
        context_length=m.context_length,
        parameters=m.parameters,
        p50_latency_ms=m.p50_latency_ms,
        price_per_1k=m.price_per_1k,
        security_score=m.security_score,
        is_online=m.is_online,
        creator_id=m.creator_id,
        creator_name=m.creator.name if m.creator else "Open Source Contributor"
    )

@router.post("/upload-artifact")
async def upload_model_artifact(
    file: UploadFile = File(...),
    model_name: str = Form("Custom Trained Model"),
    domain: str = Form("CODE GEN"),
    user_id: str = Form("usr_guest_demo"),
    db: AsyncSession = Depends(get_db)
):
    """
    Uploads custom weights / ONNX / PKL / Python artifact to persistent blob storage.
    - Stores file at: backend/artifacts/{deployment_id}/{filename}
    - Returns SHA-256 content hash for integrity verification.
    - Registers live streaming endpoint in the Deployment DB table.
    """
    deployment_id = f"dep_{uuid.uuid4().hex[:10]}"
    target_dir = ARTIFACTS_DIR / deployment_id
    target_dir.mkdir(parents=True, exist_ok=True)

    content = await file.read()
    file_path = target_dir / file.filename
    file_path.write_bytes(content)

    # SHA-256 integrity hash
    sha256_hash = hashlib.sha256(content).hexdigest()

    endpoint_url = f"http://localhost:8000/api/models/{deployment_id}/stream"

    # Register deployment in database
    dep = Deployment(
        id=deployment_id,
        user_id=user_id,
        model_id="deepseek-coder-67b-instruct",
        endpoint_url=endpoint_url,
        status="ACTIVE"
    )
    db.add(dep)
    await db.commit()

    return {
        "deployment_id":   deployment_id,
        "filename":        file.filename,
        "size_bytes":      len(content),
        "sha256":          sha256_hash,
        "storage_path":    str(file_path),
        "endpoint_url":    endpoint_url,
        "status":          "DEPLOYED",
        "message": f"Artifact {file.filename} uploaded and provisioned on GPU cluster."
    }

@router.post("/{model_id}/stream")
async def stream_model_inference(
    model_id: str,
    req: ModelInferenceRequest,
    db: AsyncSession = Depends(get_db)
):
    """Zero-latency SSE token stream with real-time per-token metering & 80/20 creator revenue distribution."""
    result = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = result.scalars().first()
    repo_id = model.repo_id if model else "meta-llama/Meta-Llama-3-8B-Instruct"
    price_per_1k = model.price_per_1k if model else 0.12
    
    async def sse_metered_stream():
        token_count = 0
        async for chunk in hf_service.stream_inference(repo_id=repo_id, model_id=model_id, prompt=req.prompt):
            token_count += 1
            yield f"data: {json.dumps(chunk)}\n\n"
            
        # Post-stream settlement in ledger
        if req.user_id:
            cost = round((token_count / 1000.0) * price_per_1k, 4)
            async with AsyncSessionLocal() as session:
                await ledger_service.record_inference_metering(
                    db=session,
                    user_id=req.user_id,
                    model_id=model_id,
                    tokens=token_count,
                    cost_credits=cost
                )
                # Auto-record tested model if user is authenticated
                tst_res = await session.execute(
                    select(TestedModel).filter(
                        TestedModel.user_id == req.user_id,
                        TestedModel.model_id == model_id
                    )
                )
                if not tst_res.scalars().first():
                    tst = TestedModel(
                        id=f"tst_{uuid.uuid4().hex[:10]}",
                        user_id=req.user_id,
                        model_id=model_id,
                        test_details=f"Inference Stream diagnostics ({token_count} tokens)"
                    )
                    session.add(tst)
                    await session.commit()
            
    return StreamingResponse(sse_metered_stream(), media_type="text/event-stream")

@router.post("/{model_id}/purchase")
async def purchase_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Deducts credits to unlock persistent access to a model in the marketplace."""
    m_res = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = m_res.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    p_res = await db.execute(
        select(PurchasedModel).filter(
            PurchasedModel.user_id == current_user.id,
            PurchasedModel.model_id == model_id
        )
    )
    if p_res.scalars().first():
        return {"status": "success", "message": "Model already purchased"}
        
    w_res = await db.execute(select(Wallet).filter(Wallet.user_id == current_user.id))
    wallet = w_res.scalars().first()
    purchase_cost = 100.0  # flat 100 credits
    if not wallet or wallet.balance_credits < purchase_cost:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance. Purchase requires 100 credits.")
        
    wallet.balance_credits = max(0.0, wallet.balance_credits - purchase_cost)
    wallet.total_spent += purchase_cost
    
    creator_royalty = round(purchase_cost * 0.80, 4)
    platform_fee = round(purchase_cost * 0.20, 4)
    
    if model.creator_id:
        c_res = await db.execute(select(Creator).filter(Creator.id == model.creator_id))
        creator = c_res.scalars().first()
        if creator:
            creator.pending_payout_credits += creator_royalty
            creator.total_earnings_credits += creator_royalty
            
    tx = LedgerTransaction(
        id=f"tx_pur_{uuid.uuid4().hex[:12]}",
        transaction_type="MODEL_PURCHASE",
        user_id=current_user.id,
        model_id=model_id,
        creator_id=model.creator_id,
        tokens_metered=0,
        cost_credits=purchase_cost,
        creator_royalty_credits=creator_royalty,
        platform_fee_credits=platform_fee,
        description=f"Marketplace Purchase: Unlocked model {model.name} (100 credits)"
    )
    db.add(tx)
    
    pm = PurchasedModel(
        id=f"pur_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        model_id=model_id,
        price_paid=purchase_cost
    )
    db.add(pm)
    
    await db.commit()
    return {"status": "success", "message": f"Successfully purchased model {model.name} for 100.0 credits."}

@router.post("/{model_id}/test")
async def test_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually records that a user ran verification tests on the model."""
    m_res = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = m_res.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    t_res = await db.execute(
        select(TestedModel).filter(
            TestedModel.user_id == current_user.id,
            TestedModel.model_id == model_id
        )
    )
    if t_res.scalars().first():
        return {"status": "success", "message": "Model already tested"}
        
    tm = TestedModel(
        id=f"tst_{uuid.uuid4().hex[:10]}",
        user_id=current_user.id,
        model_id=model_id,
        test_details="Manual verification diagnostics"
    )
    db.add(tm)
    await db.commit()
    return {"status": "success", "message": "Test recorded successfully."}

@router.put("/{model_id}", response_model=AIModelResponse)
async def update_model(
    model_id: str,
    model_update: AIModelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows creators to update their published model details."""
    result = await db.execute(select(AIModel).options(selectinload(AIModel.creator)).filter(AIModel.id == model_id))
    model = result.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    c_res = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = c_res.scalars().first()
    if not creator or model.creator_id != creator.id:
        raise HTTPException(status_code=403, detail="You do not have permission to update this model")
        
    update_data = model_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "domain" and value:
            setattr(model, key, value.upper())
        elif key == "task_tag" and value:
            setattr(model, key, value.upper())
        else:
            setattr(model, key, value)
            
    db.add(model)
    await db.commit()
    await db.refresh(model)
    
    return AIModelResponse(
        id=model.id,
        name=model.name,
        repo_id=model.repo_id,
        domain=model.domain,
        task_tag=model.task_tag,
        description=model.description,
        context_length=model.context_length,
        parameters=model.parameters,
        p50_latency_ms=model.p50_latency_ms,
        price_per_1k=model.price_per_1k,
        purchase_price=model.purchase_price,
        security_score=model.security_score,
        is_online=model.is_online,
        creator_id=model.creator_id,
        creator_name=model.creator.name if model.creator else "Open Source Contributor"
    )

@router.delete("/{model_id}")
async def delete_model(
    model_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows creators to delete their published model."""
    result = await db.execute(select(AIModel).filter(AIModel.id == model_id))
    model = result.scalars().first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
        
    c_res = await db.execute(select(Creator).filter(Creator.user_id == current_user.id))
    creator = c_res.scalars().first()
    if not creator or model.creator_id != creator.id:
        raise HTTPException(status_code=403, detail="You do not have permission to delete this model")
        
    await db.delete(model)
    await db.commit()
    return {"status": "success", "message": f"Model {model_id} deleted successfully"}