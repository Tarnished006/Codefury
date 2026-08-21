from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import OWASPAuditResponse
from app.services.security_engine import security_engine
from app.database import get_db

router = APIRouter(prefix="/audit", tags=["OWASP Security Radar"])


@router.get("/{model_id}", response_model=OWASPAuditResponse)
async def get_security_audit(model_id: str, db: AsyncSession = Depends(get_db)):
    """
    Executes a live two-stage adversarial OWASP LLM Top-10 penetration assessment:
    1. Dispatches 5 spec-compliant probes concurrently to the target model via HF Inference.
    2. Forwards captured responses to Groq (LLM-as-a-Judge) for safety scoring + reasoning.
    Returns a full Security Radar payload with per-axis scores, vulnerability breakdown,
    reasoning text, and raw probe_outputs for the frontend radar chart.
    """
    return await security_engine.run_live_audit(model_id, db)


@router.get("/{model_id}/report")
async def get_security_audit_report(model_id: str, db: AsyncSession = Depends(get_db)):
    """
    Extended audit report: includes full probe-level breakdown with exact probe text,
    raw model response, per-probe status, and Groq evaluator reasoning narrative.
    """
    audit = await security_engine.run_live_audit(model_id, db)
    return {
        "model_id":     audit.model_id,
        "repo_id":      audit.repo_id,
        "overall_score": audit.overall_score,
        "evaluated_by": audit.evaluated_by,
        "reasoning":    audit.reasoning,
        "scores": {
            "prompt_injection":    audit.prompt_injection_score,
            "jailbreak_resistance": audit.jailbreak_resistance_score,
            "task_hijacking":      audit.task_hijacking_score,
            "data_leakage":        audit.data_leakage_score,
            "context_manipulation": audit.context_manipulation_score,
        },
        "probe_outputs":  audit.probe_outputs,
        "vulnerabilities": audit.vulnerabilities,
        "audited_at":     audit.audited_at,
    }