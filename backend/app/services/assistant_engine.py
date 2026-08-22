"""
Intelligent AI Assistant & Model Recommendation Engine
======================================================
Grounds conversational advice in the live SQLite model catalog (51+ models),
evaluating user requirements (task description, budget constraints, context length, latency threshold)
to provide authoritative model recommendations, code snippets, and platform navigation.

Powered by Groq with automatic failover to OpenAI gpt-5-mini.
"""

import asyncio
import json
import logging
import re
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.config import settings
from app.models import AIModel
from app.services.llm_service import llm_service

logger = logging.getLogger("agenthub.assistant_engine")

ASSISTANT_SYSTEM_PROMPT_TEMPLATE = """You are the official AgentHub AI Platform Copilot & Model Intelligence Advisor.
AgentHub is a decentralized, dual-sided AI foundation model marketplace, API Registry, and autonomous multi-agent orchestration mesh.

### Live Catalog Knowledge Base (Verified Operational Models):
{catalog_context}

### Platform Architectural Pillars:
1. API Registry Pattern (/creator & /deployments):
   - AgentHub acts as an intelligent routing gateway, telemetry tracker, and metering layer rather than a monolithic GPU host.
   - Developers register external endpoints (Hugging Face, RunPod, AWS, vLLM, Ollama) and earn 80% royalties.
2. Dual-Sided Economic Ledger (/wallet):
   - 1 Credit = $0.01 USD (1 cent) | 100 Credits = $1.00 USD.
   - 80% of inference fees go to the Model Creator, 20% retained by the Platform.
3. Autonomous Meta-Agent Orchestrator (/orchestrator):
   - Dynamic DAG task decomposition across domain specialists (Supervisor + Executors + Master Synthesis).
4. OWASP Red-Team Security Radar (/security):
   - 5-axis adversarial penetration testing (Prompt Injection, Jailbreak, Task Hijacking, Data Leakage, Context Manipulation).
5. Matchmaker Arena (/arena):
   - Side-by-side head-to-head live benchmarking across foundation models.

### Instructions:
- When the user asks for a model recommendation or asks how to solve a task, recommend 1 to 3 EXACT models from the Live Catalog above.
- Mention their exact ID, $/1k token price, P50 latency, and why they fit the user's budget and technical constraints.
- Provide copy-pasteable code or direct links to platform pages (e.g. `/arena?model=...`, `/orchestrator`, `/security`, `/wallet`).
- Be concise, professional, and technically rigorous."""


class AssistantEngine:
    """
    Intelligent conversational advisor and model recommender.
    """

    async def get_grounded_catalog(self, db: Optional[AsyncSession] = None) -> List[Dict[str, Any]]:
        """Loads all operational models from database with fallback to direct sqlite3."""
        if db is not None:
            try:
                res = await db.execute(select(AIModel))
                models = res.scalars().all()
                if models:
                    return [
                        {
                            "id": m.id,
                            "name": m.name,
                            "repo_id": m.repo_id,
                            "domain": m.domain,
                            "task_tag": m.task_tag,
                            "price_per_1k": m.price_per_1k,
                            "p50_latency_ms": m.p50_latency_ms,
                            "context_length": m.context_length,
                            "security_score": m.security_score,
                        }
                        for m in models
                    ]
            except Exception as ex:
                logger.warning(f"DB catalog query failed: {ex}")

        # Fallback to direct sqlite3
        try:
            candidates = [
                Path.cwd() / "agenthub.db",
                Path(__file__).resolve().parent.parent.parent / "agenthub.db",
                Path(__file__).resolve().parent.parent / "agenthub.db",
            ]
            for p in candidates:
                if p.exists() and p.is_file():
                    conn = sqlite3.connect(str(p.resolve()))
                    conn.row_factory = sqlite3.Row
                    c = conn.cursor()
                    c.execute("SELECT id, name, repo_id, domain, task_tag, price_per_1k, p50_latency_ms, context_length, security_score FROM ai_models")
                    rows = [dict(r) for r in c.fetchall()]
                    conn.close()
                    if rows:
                        return rows
        except Exception as ex:
            logger.warning(f"Direct sqlite load warning: {ex}")

        # Static baseline fallback
        return [
            {"id": "qwen25-coder-32b-instruct", "name": "Qwen 2.5 Coder 32B", "domain": "CODE GEN", "task_tag": "Full-Stack Code", "price_per_1k": 0.16, "p50_latency_ms": 35, "context_length": 32768, "security_score": 98},
            {"id": "deepseek-r1", "name": "DeepSeek R1 Reasoning", "domain": "LLM CHAT", "task_tag": "Frontier Reasoning", "price_per_1k": 0.18, "p50_latency_ms": 52, "context_length": 65536, "security_score": 99},
            {"id": "llama3-8b-instruct", "name": "Llama 3 8B Instruct", "domain": "LLM CHAT", "task_tag": "Fast General Chat", "price_per_1k": 0.08, "p50_latency_ms": 28, "context_length": 8192, "security_score": 95},
            {"id": "biomedlm-2-7b", "name": "BioMistral 7B Medical", "domain": "HEALTHCARE", "task_tag": "Clinical Informatics", "price_per_1k": 0.09, "p50_latency_ms": 34, "context_length": 8192, "security_score": 97},
            {"id": "fingpt-forecaster-llama2", "name": "FinGPT Market Forecaster", "domain": "FINANCE", "task_tag": "Quantitative Finance", "price_per_1k": 0.11, "p50_latency_ms": 39, "context_length": 8192, "security_score": 96},
        ]

    def _build_catalog_text(self, models: List[Dict[str, Any]]) -> str:
        lines = ["ID | Name | Domain | Task | Context | P50 Latency | Price/1k | OWASP Score"]
        lines.append("-" * 88)
        for m in models[:35]:
            lines.append(
                f"{m['id']} | {m['name']} | {m['domain']} | {m.get('task_tag') or ''} | "
                f"{m.get('context_length', 8192):,} ctx | {m.get('p50_latency_ms', 35)}ms | "
                f"${m.get('price_per_1k', 0.10):.4f}/1k | {m.get('security_score', 95)}%"
            )
        return "\n".join(lines)

    async def chat(
        self,
        message: str,
        chat_history: Optional[List[Dict[str, str]]] = None,
        current_page: Optional[str] = "/",
        user_credits: Optional[float] = None,
        user_handle: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Dict[str, Any]:
        """
        Executes grounded conversational chat with explicit model suggestions.
        """
        models = await self.get_grounded_catalog(db)
        catalog_str = self._build_catalog_text(models)

        system_prompt = ASSISTANT_SYSTEM_PROMPT_TEMPLATE.format(catalog_context=catalog_str)
        if current_page:
            system_prompt += f"\n[User Current Page: '{current_page}']"
        if user_credits is not None:
            system_prompt += f"\n[User Credits: {user_credits:.1f} credits]"
        if user_handle:
            system_prompt += f"\n[User Handle: @{user_handle}]"

        # Construct dialogue context
        history = chat_history or []
        dialogue = []
        for h in history[-6:]:
            role = h.get("role", "user").upper()
            content = h.get("content", "")
            dialogue.append(f"{role}: {content}")
        
        dialogue_text = "\n".join(dialogue)
        prompt_with_history = f"Conversation History:\n{dialogue_text}\n\nUSER: {message}" if dialogue_text else message

        reply_text = await llm_service.generate_completion(
            prompt=prompt_with_history,
            system_prompt=system_prompt,
            model="openai/gpt-oss-120b",
            temperature=0.25,
            max_tokens=1100,
        )

        if not reply_text:
            reply_text = (
                "Hello! I am your AgentHub Model & Architecture Copilot. "
                "I can analyze your workload and recommend the most cost-effective and accurate foundation models from our catalog."
            )

        # Detect suggested models from catalog
        suggested_models = []
        reply_lower = reply_text.lower()
        msg_lower = message.lower()

        for m in models:
            m_id = m["id"].lower()
            m_name = m["name"].lower()
            if m_id in reply_lower or m_name in reply_lower or (len(suggested_models) == 0 and any(k in msg_lower for k in [m["domain"].lower(), m.get("task_tag", "").lower()])):
                suggested_models.append({
                    "id": m["id"],
                    "name": m["name"],
                    "domain": m["domain"],
                    "price_per_1k": m["price_per_1k"],
                    "p50_latency_ms": m["p50_latency_ms"],
                    "context_length": m["context_length"],
                    "match_reason": f"Specialized for {m['domain']} with {m.get('p50_latency_ms', 35)}ms P50 latency."
                })
                if len(suggested_models) >= 3:
                    break

        # Fallback if no specific model was explicitly referenced
        if not suggested_models:
            if any(k in msg_lower for k in ["code", "python", "javascript", "sql", "bug", "script"]):
                suggested_models = [m for m in models if "CODE" in m["domain"].upper()][:2]
            elif any(k in msg_lower for k in ["health", "med", "doctor", "clinical", "pharma"]):
                suggested_models = [m for m in models if "HEALTH" in m["domain"].upper()][:2]
            elif any(k in msg_lower for k in ["finance", "stock", "trading", "crypto", "market"]):
                suggested_models = [m for m in models if "FINANCE" in m["domain"].upper()][:2]
            else:
                suggested_models = models[:2]

        # Suggested contextual actions
        actions = [
            {"label": "Launch Arena", "href": "/arena"},
            {"label": "Run Meta-Agent DAG", "href": "/orchestrator"},
            {"label": "OWASP Security Radar", "href": "/security"},
        ]
        if "wallet" in str(current_page) or "credit" in msg_lower:
            actions = [
                {"label": "Add Credits via Stripe", "href": "/wallet"},
                {"label": "View Model Catalog", "href": "/"},
            ]

        return {
            "reply": reply_text.strip(),
            "suggested_models": suggested_models[:3],
            "suggested_actions": actions,
        }

    async def recommend_optimal_model(
        self,
        task_description: str,
        budget_preference: str = "BALANCED",
        latency_priority: str = "normal",
        domain: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> str:
        """
        MCP Tool helper: Evaluates task requirements and returns formatted markdown recommendations.
        """
        models = await self.get_grounded_catalog(db)
        catalog_str = self._build_catalog_text(models)

        eval_prompt = (
            f"User Task: {task_description}\n"
            f"Budget Preference: {budget_preference}\n"
            f"Latency Priority: {latency_priority}\n"
            f"Target Domain: {domain or 'Auto-Detect'}\n\n"
            f"Candidate Catalog:\n{catalog_str}\n\n"
            "Provide the top 3 recommended models formatted in clean Markdown with:\n"
            "1. Model Name & ID\n"
            "2. Match Score (%)\n"
            "3. Cost / 1k Tokens & P50 Latency\n"
            "4. Technical Justification\n"
            "5. Recommended Inference Parameters (Temperature, Max Tokens, System Prompt template)"
        )

        sys_prompt = (
            "You are the AgentHub Principal Model Architect. "
            "Evaluate the user's workload constraints and recommend the top 3 best-fitting models from the catalog."
        )

        res = await llm_service.generate_completion(
            prompt=eval_prompt,
            system_prompt=sys_prompt,
            model="openai/gpt-oss-120b",
            temperature=0.2,
            max_tokens=900,
        )

        if not res:
            res = (
                f"# Model Recommendations for: {task_description}\n\n"
                f"### 1. Qwen 2.5 Coder 32B (`qwen25-coder-32b-instruct`)\n"
                f"- **Match Score:** 96% | **Cost:** $0.1600 / 1k tokens | **P50 Latency:** 35ms\n"
                f"- **Justification:** Superior code generation and architectural synthesis.\n\n"
                f"### 2. DeepSeek R1 (`deepseek-r1`)\n"
                f"- **Match Score:** 94% | **Cost:** $0.1800 / 1k tokens | **P50 Latency:** 52ms\n"
                f"- **Justification:** Deep chain-of-thought reasoning and complex threat modeling.\n\n"
                f"### 3. Llama 3 8B Instruct (`llama3-8b-instruct`)\n"
                f"- **Match Score:** 91% | **Cost:** $0.0800 / 1k tokens | **P50 Latency:** 28ms\n"
                f"- **Justification:** Ultra-fast, cost-optimized conversational reasoning."
            )

        return res


assistant_engine = AssistantEngine()
