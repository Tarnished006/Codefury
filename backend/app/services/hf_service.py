import asyncio
import json
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List
from huggingface_hub import AsyncInferenceClient
from app.config import settings
from app.services.demo_generator import generate_simulated_stream

logger = logging.getLogger("agenthub.hf")

class HuggingFaceService:
    def __init__(self):
        self._client: Optional[AsyncInferenceClient] = None

    @property
    def client(self) -> AsyncInferenceClient:
        token = settings.hf_api_token
        if self._client is None or (self._client.token != token):
            self._client = AsyncInferenceClient(token=token)
        return self._client

    async def stream_inference(
        self,
        repo_id: str,
        model_id: str,
        prompt: str,
        messages: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 512,
        temperature: float = 0.7
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streams real token chunks from Hugging Face Inference API with fallback on error."""
        token = settings.hf_api_token
        
        # If explicitly in DEMO_MODE or no token supplied, use fallback generator
        if settings.DEMO_MODE or not token:
            async for chunk in generate_simulated_stream(model_id, prompt):
                yield chunk
            return

        formatted_messages = messages or [{"role": "user", "content": prompt}]
        index = 0

        try:
            # Live AsyncInferenceClient chat streaming
            stream = await self.client.chat.completions.create(
                model=repo_id,
                messages=formatted_messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    token_text = chunk.choices[0].delta.content
                    yield {
                        "token": token_text,
                        "index": index,
                        "done": False,
                        "model_id": model_id
                    }
                    index += 1

            # Final completion signal
            yield {
                "token": "",
                "index": index,
                "done": True,
                "model_id": model_id
            }

        except Exception as e:
            logger.warning(f"Live HF streaming failed for {repo_id} ({e}), falling back to deterministic stream.")
            async for chunk in generate_simulated_stream(model_id, prompt):
                yield chunk

    async def generate_completion(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2
    ) -> str:
        """Non-streaming generation for Meta-Agent DAG synthesis and OWASP vulnerability grading."""
        token = settings.hf_api_token
        if settings.DEMO_MODE or not token:
            return ""

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            res = await self.client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False
            )
            if res.choices and res.choices[0].message.content:
                return res.choices[0].message.content
        except Exception as e:
            logger.warning(f"Live completion error on {model_id}: {e}")
            
        return ""

hf_service = HuggingFaceService()