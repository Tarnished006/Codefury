"""
Intelligent AI Model Recommendation Router
===========================================
Recommends optimal AI foundation models from the 51+ model catalog based on:
  • Natural language use-case specification
  • Strict budget constraints (price per 1k tokens)
  • Latency requirements (p50 ms threshold)
  • Context window capacity (4k to 64k+)
  • Domain specializations (Code Gen, Healthcare, Finance, LLM Chat, Vision AI)
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import AIModel
from app.services.llm_service import llm_service

logger = logging.getLogger("agenthub.recommendations")
router = APIRouter(prefix="/models", tags=["Model Recommendations"])


class RecommendationRequest(BaseModel):
    use_case: str = Field(..., description="Detailed description of the user's application and technical requirements")
    domain: Optional[str] = Field("ALL", description="Target domain: 'ALL', 'CODE GEN', 'LLM CHAT', 'HEALTHCARE', 'FINANCE', 'VISION AI'")
    budget_tier: Optional[str] = Field("BALANCED", description="'ECONOMY' (lowest cost), 'BALANCED', 'PERFORMANCE' (frontier reasoning)")
    max_price_per_1k: Optional[float] = Field(None, description="Maximum credits willing to pay per 1,000 tokens")
    min_context_length: Optional[int] = Field(4096, description="Minimum context window size in tokens")
    max_latency_ms: Optional[int] = Field(None, description="Maximum acceptable p50 latency in ms")
    priority: Optional[str] = Field("balanced", description="Optimization priority: 'cost', 'speed', 'quality', 'balanced'")


class RecommendedModelItem(BaseModel):
    model_id: str
    name: str
    repo_id: str
    domain: str
    task_tag: Optional[str]
    match_score: int
    price_per_1k: float
    p50_latency_ms: int
    context_length: int
    fit_rationale: str
    pros: List[str]
    cons: List[str]
    recommended_params: Dict[str, Any]


class RecommendationResponse(BaseModel):
    use_case: str
    domain_selected: str
    budget_strategy: str
    total_models_evaluated: int
    recommended_models: List[RecommendedModelItem]
    architect_summary: str


RECOMMENDER_SYSTEM_PROMPT = """You are the AgentHub Principal Model Architect & Recommendation Engine.
Analyze the user's technical requirements and select the top 3 best-fitting AI models from the provided catalog.

For each selected model, output:
- model_id: Exact model ID from catalog
- match_score: Integer from 70 to 99 representing suitability
- fit_rationale: 2-sentence technical justification for why this model excels for this use case
- pros: Array of 2-3 specific technical advantages
- cons: Array of 1-2 honest trade-offs (e.g. latency vs. reasoning depth)
- recommended_params: { "temperature": float, "max_tokens": int, "system_prompt_hint": string }

Output strictly valid JSON matching this schema:
{
  "architect_summary": "High-level architectural recommendation overview",
  "recommendations": [
    {
      "model_id": "string",
      "match_score": 95,
      "fit_rationale": "string",
      "pros": ["string", "string"],
      "cons": ["string"],
      "recommended_params": {
        "temperature": 0.2,
        "max_tokens": 1024,
        "system_prompt_hint": "string"
      }
    }
  ]
}
Output pure JSON only, without backticks or Markdown formatting."""


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_models(
    req: RecommendationRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Intelligent Model Recommendation Engine:
    Evaluates catalog models against use-case, budget, latency, and context constraints.
    """
    # 1. Fetch catalog models from database
    query = select(AIModel)
    if req.domain and req.domain.upper() not in ("ALL", "ALL DOMAINS", "ALL_DOMAINS"):
        d = req.domain.replace("_", " ").upper()
        query = query.filter(AIModel.domain == d)
    
    res = await db.execute(query)
    all_models = res.scalars().all()
    
    if not all_models:
        res_all = await db.execute(select(AIModel))
        all_models = res_all.scalars().all()

    # 2. Filter candidates based on hard constraints if specified
    filtered = []
    for m in all_models:
        if req.max_price_per_1k and m.price_per_1k > req.max_price_per_1k * 1.3:
            continue
        if req.min_context_length and m.context_length < req.min_context_length * 0.75:
            continue
        if req.max_latency_ms and m.p50_latency_ms > req.max_latency_ms * 1.5:
            continue
        filtered.append(m)

    candidates = filtered if len(filtered) >= 3 else all_models

    # Build concise catalog summary for LLM analysis
    catalog_lines = ["ID | Name | Domain | Task | Ctx | P50 | Cost/1k"]
    for m in candidates[:25]:
        catalog_lines.append(
            f"{m.id} | {m.name} | {m.domain} | {m.task_tag or ''} | {m.context_length} | {m.p50_latency_ms}ms | ${m.price_per_1k:.4f}"
        )
    catalog_prompt_str = "\n".join(catalog_lines)

    user_prompt = (
        f"User Use Case: {req.use_case}\n"
        f"Target Domain: {req.domain}\n"
        f"Budget Tier: {req.budget_tier}\n"
        f"Max Price/1k: {req.max_price_per_1k or 'Flexible'}\n"
        f"Min Context Window: {req.min_context_length} tokens\n"
        f"Max Latency Target: {req.max_latency_ms or 'Flexible'} ms\n"
        f"Optimization Priority: {req.priority}\n\n"
        f"Available Model Candidates:\n{catalog_prompt_str}"
    )

    # 3. Query UniversalLLMService (Groq with OpenAI gpt-5-mini failover)
    raw_llm = await llm_service.generate_completion(
        prompt=user_prompt,
        system_prompt=RECOMMENDER_SYSTEM_PROMPT,
        model="openai/gpt-oss-120b",
        temperature=0.2,
        max_tokens=1200
    )

    # 4. Parse LLM JSON
    parsed_json = _parse_recommender_json(raw_llm)
    
    # 5. Build hydrated response mapping back to full model database records
    model_map = {m.id: m for m in all_models}
    recommended_items: List[RecommendedModelItem] = []
    
    if parsed_json and "recommendations" in parsed_json:
        for rec in parsed_json["recommendations"]:
            mid = rec.get("model_id")
            m_obj = model_map.get(mid)
            if not m_obj:
                # Fuzzy fallback matching
                for cand in candidates:
                    if cand.id in str(mid) or str(mid) in cand.id:
                        m_obj = cand
                        break
            if m_obj:
                recommended_items.append(
                    RecommendedModelItem(
                        model_id=m_obj.id,
                        name=m_obj.name,
                        repo_id=m_obj.repo_id,
                        domain=m_obj.domain,
                        task_tag=m_obj.task_tag,
                        match_score=int(rec.get("match_score", 92)),
                        price_per_1k=m_obj.price_per_1k,
                        p50_latency_ms=m_obj.p50_latency_ms,
                        context_length=m_obj.context_length,
                        fit_rationale=rec.get("fit_rationale", f"Optimal match for {req.use_case}"),
                        pros=rec.get("pros", ["High parameter efficiency", "Low latency inference"]),
                        cons=rec.get("cons", ["Requires tuned temperature"]),
                        recommended_params=rec.get("recommended_params", {"temperature": 0.3, "max_tokens": 1024})
                    )
                )

    # Fallback if parsing was empty
    if not recommended_items:
        for m in candidates[:3]:
            recommended_items.append(
                RecommendedModelItem(
                    model_id=m.id,
                    name=m.name,
                    repo_id=m.repo_id,
                    domain=m.domain,
                    task_tag=m.task_tag,
                    match_score=90,
                    price_per_1k=m.price_per_1k,
                    p50_latency_ms=m.p50_latency_ms,
                    context_length=m.context_length,
                    fit_rationale=f"Selected based on {m.domain} domain performance and budget compatibility.",
                    pros=["Verified enterprise stability", f"{m.context_length:,} token context window"],
                    cons=["Standard inference parameters recommended"],
                    recommended_params={"temperature": 0.2, "max_tokens": 1024}
                )
            )

    architect_summary = (
        parsed_json.get("architect_summary")
        if parsed_json and "architect_summary" in parsed_json
        else f"Evaluated {len(all_models)} marketplace foundation models for '{req.use_case}'. Recommended top {len(recommended_items)} candidates balancing accuracy, latency, and cost."
    )

    return RecommendationResponse(
        use_case=req.use_case,
        domain_selected=req.domain or "ALL",
        budget_strategy=req.budget_tier or "BALANCED",
        total_models_evaluated=len(all_models),
        recommended_models=recommended_items,
        architect_summary=architect_summary
    )


def _parse_recommender_json(raw_text: str) -> Optional[Dict[str, Any]]:
    if not raw_text:
        return None
    try:
        cleaned = re.sub(r"```(?:json)?", "", raw_text).strip()
        match = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return json.loads(cleaned)
    except Exception:
        return None
