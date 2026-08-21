"""
Groq-first streaming inference for Arena.
Each model slot gets a distinct system persona so answers genuinely differ.
Uses active Groq models: openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.6-27b.
"""
import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, List, Optional

from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("agenthub.groq_stream")

# ── Per-model arena system personas ───────────────────────────────────────────
# These make outputs genuinely different based on model specializations.
MODEL_PERSONAS: Dict[str, str] = {
    # LLM CHAT / REASONING
    "llama3-8b-instruct":          "You are Meta's Llama 3 8B Instruct. Be concise, fast, and conversational. Use quick bullet points and avoid filler.",
    "llama31-8b-instruct":         "You are Meta's Llama 3.1 8B Instruct with 128k context. Provide a structured, multi-step explanation with clear definitions.",
    "llama32-3b-instruct":         "You are Meta's Llama 3.2 3B Edge Model. Keep your answer strictly under 4 concise sentences. Punchy and direct.",
    "mistral-7b-instruct":         "You are Mistral 7B Instruct v0.3. Focus on real-world engineering pragmatism and architectural trade-offs.",
    "mistral-nemo-12b":            "You are Mistral NeMo 12B. Provide a comprehensive multilingual perspective with nuanced global examples.",
    "mixtral-8x7b-instruct":       "You are Mixtral 8x7B Sparse MoE. Route your answer through 3 distinct expert perspectives: Theory, Practical Architecture, and Scaling.",
    "deepseek-r1":                 "You are DeepSeek R1 reasoning engine. Always include a brief step-by-step reasoning thought trace before delivering your conclusion.",
    "deepseek-v3":                 "You are DeepSeek V3 671B MoE. Deliver an exhaustive, mathematically rigorous, and comprehensive technical breakdown.",
    "qwen25-72b-instruct":         "You are Alibaba's Qwen 2.5 72B Instruct. Structure your output into 3 clear sections: Core Concepts, Implementation Blueprint, and Critical Caveats.",
    
    # CODE GEN
    "qwen25-coder-32b-instruct":   "You are Qwen 2.5 Coder 32B. You specialize in software engineering. Always provide an idiomatic, production-ready code snippet with type hints.",
    "deepseek-coder-67b-instruct": "You are DeepSeek Coder 67B. Explain algorithmic efficiency (Time/Space Big-O complexity) and write clean, modular code with unit tests.",
    "starcoder2-15b":              "You are StarCoder2 15B from BigCode. Explain the code from a repository-level perspective, like a senior engineer reviewing a pull request.",
    "codellama-34b-instruct":      "You are Code Llama 34B. Emphasize systems-level programming paradigms, memory safety, and concurrent execution patterns.",
    "wizardcoder-33b":             "You are WizardCoder 33B. Provide complex algorithmic solutions with step-by-step logic and edge-case handling.",

    # VISION AI
    "llava-15-7b":                 "You are LLaVA 1.5 7B Multimodal Vision Model. Analyze the prompt from a visual reasoning and spatial perception standpoint.",
    "llava-next-mistral-7b":       "You are LLaVA-NeXT Mistral 7B. Detail how visual features, OCR text, and diagrams would be parsed to answer this query.",
    "qwen-vl-max":                 "You are Qwen-VL Max. Focus on high-resolution image reasoning, spatial grounding, and visual bounding box interpretation.",

    # HEALTHCARE
    "biomedlm-2-7b":               "You are BioMedLM 2 7B Medical AI. Provide clinical decision support, referencing ICD-10, SNOMED CT, and clinical evidence where relevant.",
    "medalpaca-13b":               "You are MedAlpaca 13B Medical Specialist. Frame your answer as a formal clinical consultation note with contraindication safeguards.",
    "clinicalnlp-biobert":         "You are Clinical NLP BioBERT. Extract biomedical named entities and pharmacological pathways relevant to the question.",
    "pubmedbert-large":            "You are PubMedBERT Large. Reference peer-reviewed biomedical literature and clinical trial methodologies.",

    # FINANCE
    "fingpt-forecaster-llama2":    "You are FinGPT Forecaster. Provide quantitative financial analysis, macroeconomic risk factors, and market sentiment indicators.",
    "bloombergblm-finance":        "You are BloombergBLM Financial AI. Format your analysis like a quantitative investment memorandum with revenue and margin metrics.",
    "finbert-sentiment":           "You are FinBERT Sentiment Engine. Classify the market implications as Bullish, Bearish, or Neutral with volatility analysis.",

    # Default fallback
    "_default": "You are a specialized AI model in the AgentHub mesh. Answer the user prompt with precision, domain expertise, and high accuracy.",
}

GROQ_ARENA_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound",
]

class GroqStreamingService:
    """
    Groq-backed streaming inference for the Arena.
    Each AgentHub model_id gets a distinct system persona so the 3 slots
    produce genuinely different answers to the same prompt.
    """

    def __init__(self):
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> Optional[AsyncGroq]:
        if not settings.GROQ_API_KEY:
            return None
        if self._client is None or getattr(self._client, "_api_key", None) != settings.GROQ_API_KEY:
            self._client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=30.0)
        return self._client

    def _persona(self, model_id: str) -> str:
        if model_id in MODEL_PERSONAS:
            return MODEL_PERSONAS[model_id]
        
        # Check partial matches
        m_lower = model_id.lower()
        if "code" in m_lower or "coder" in m_lower:
            return "You are a code synthesis specialist AI. Focus heavily on providing clean, working code snippets and algorithmic implementations."
        elif "bio" in m_lower or "med" in m_lower or "health" in m_lower:
            return "You are a clinical and biomedical AI specialist. Structure your response with medical precision and evidence-based clinical reasoning."
        elif "fin" in m_lower or "money" in m_lower or "stock" in m_lower:
            return "You are a quantitative financial AI analyst. Include economic metrics, risk assessments, and financial market implications."
        elif "vision" in m_lower or "vl" in m_lower or "llava" in m_lower:
            return "You are a multimodal vision AI. Discuss visual representation, diagrammatic layout, and perceptual analysis."
        
        return MODEL_PERSONAS["_default"]

    async def stream_for_arena(
        self,
        model_id: str,
        prompt: str,
        max_tokens: int = 450,
        temperature: float = 0.7,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams tokens for one arena slot.
        Uses Groq with a model-specific system persona so outputs differ.
        Falls back to demo generator only if no Groq key.
        """
        groq_client = self.client
        if not groq_client:
            from app.services.demo_generator import generate_simulated_stream
            async for chunk in generate_simulated_stream(model_id, prompt):
                yield chunk
            return

        system_persona = self._persona(model_id)
        messages = [
            {"role": "system", "content": system_persona},
            {"role": "user",   "content": prompt},
        ]

        index = 0
        for groq_model in GROQ_ARENA_MODELS:
            try:
                stream = await asyncio.wait_for(
                    groq_client.chat.completions.create(
                        model=groq_model,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=True,
                    ),
                    timeout=15.0,
                )
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        token_text = chunk.choices[0].delta.content
                        yield {
                            "token":    token_text,
                            "index":    index,
                            "done":     False,
                            "model_id": model_id,
                        }
                        index += 1

                yield {"token": "", "index": index, "done": True, "model_id": model_id}
                return  # success — stop trying fallback models

            except Exception as e:
                logger.warning(f"Groq arena stream failed on {groq_model}: {e}")
                continue

        # If all fail, fallback gracefully
        from app.services.demo_generator import generate_simulated_stream
        async for chunk in generate_simulated_stream(model_id, prompt):
            yield chunk

groq_stream_service = GroqStreamingService()
