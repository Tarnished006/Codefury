from fastapi import APIRouter
from app.schemas import OrchestrateRequest, OrchestrationResponse
from app.services import orchestrator_engine

router = APIRouter(prefix="/orchestrate", tags=["Meta-Agent Orchestrator"])

@router.post("", response_model=OrchestrationResponse)
async def orchestrate_task(req: OrchestrateRequest):
    """Decomposes natural language intent into an autonomous multi-model DAG plan."""
    return await orchestrator_engine.orchestrate_intent(req.goal)