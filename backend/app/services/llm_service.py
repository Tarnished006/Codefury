import logging
import asyncio
from typing import Optional, Dict, Any, List
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("agenthub.groq")

class GroqLLMService:
    def __init__(self):
        self._client: Optional[AsyncGroq] = None

    @property
    def client(self) -> Optional[AsyncGroq]:
        if not settings.GROQ_API_KEY:
            return None
        if self._client is None or getattr(self._client, "_api_key", None) != settings.GROQ_API_KEY:
            try:
                self._client = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=5.0)
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
        """Executes high-speed async LLM completion via Groq with automatic model fallback."""
        groq_client = self.client
        if not groq_client:
            return ""

        messages: List[Dict[str, str]] = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        target_models = [model, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]

        for m in target_models:
            try:
                res = await asyncio.wait_for(
                    groq_client.chat.completions.create(
                        model=m,
                        messages=messages,
                        temperature=temperature,
                        max_tokens=max_tokens
                    ),
                    timeout=4.0
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content
            except Exception as e:
                logger.warning(f"Groq completion on {m} failed or timed out: {e}")
                continue

        return ""

llm_service = GroqLLMService()