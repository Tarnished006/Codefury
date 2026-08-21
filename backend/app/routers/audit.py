from fastapi import APIRouter
from app.schemas import OWASPAuditResponse
from app.services import security_engine

router = APIRouter(prefix="/audit", tags=["OWASP Security Radar"])

@router.get("/{model_id}", response_model=OWASPAuditResponse)
async def get_security_audit(model_id: str):
    """Returns 5-axis OWASP red-team audit scores and vulnerability telemetry."""
    return security_engine.get_audit_report(model_id)