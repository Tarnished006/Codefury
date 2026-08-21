import logging
import asyncio
from typing import Optional, Dict, Any, List
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("agenthub.groq")

# Verified active Groq models on this account
ACTIVE_GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound",
    "groq/compound-mini",
]

class GroqLLMService:
    def __init__(self):
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> Optional[AsyncGroq]:
        if not settings.GROQ_API_KEY:
            return None
        if self._client is None or getattr(self._client, "_api_key", None) != settings.GROQ_API_KEY:
            try:
                self._client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=30.0)
            except Exception as e:
                logger.warning(f"Failed to initialize AsyncGroq: {e}")
                self._client = None
        return self._client

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: str = "openai/gpt-oss-120b",
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> str:
        """Executes high-speed async LLM completion via Groq with verified model fallback."""
        groq_client = self.client
        if not groq_client:
            return ""

        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # Try requested model first, then verified active models
        target_models = [model] + [m for m in ACTIVE_GROQ_MODELS if m != model]

        for m in target_models:
            try:
                res = await asyncio.wait_for(
                    groq_client.chat.completions.create(
                        model=m,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens
                    ),
                    timeout=20.0
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content
            except Exception as e:
                logger.warning(f"Groq completion on {m} failed: {e}")
                continue

        return ""

llm_service = GroqLLMService()