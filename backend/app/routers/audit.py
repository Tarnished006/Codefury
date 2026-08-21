from fastapi import APIRouter
from app.schemas import OWASPAuditResponse
from app.services.security_engine import security_engine

router = APIRouter(prefix="/audit", tags=["OWASP Security Radar"])

@router.get("/{model_id}", response_model=OWASPAuditResponse)
async def get_security_audit(model_id: str):
    """Executes live dynamic red-team penetration assessment firing 5 adversarial probes and grading containment resistance."""
    return await security_engine.run_live_audit(model_id)