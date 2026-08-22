import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, Optional, List
from huggingface_hub import AsyncInferenceClient
from app.config import settings
from app.services.llm_service import llm_service

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
        """Streams real token chunks from Hugging Face Inference API with live Groq / OpenAI fallback."""
        formatted_messages = messages or [{"role": "user", "content": prompt}]
        index = 0

        # Try live Hugging Face first
        if not settings.DEMO_MODE and settings.hf_api_token:
            try:
                stream = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=repo_id,
                        messages=formatted_messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=True
                    ),
                    timeout=6.0
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

                yield {
                    "token": "",
                    "index": index,
                    "done": True,
                    "model_id": model_id
                }
                return

            except Exception as e:
                logger.warning(f"Live HF streaming failed for {repo_id} ({e}), falling back to Groq/OpenAI stream.")

        # Live Groq / OpenAI stream
        sys_prompt = f"You are {repo_id}, an open-weight foundation model deployed on AgentHub. Answer accurately."
        async for chunk in llm_service.stream_completion(
            prompt=prompt,
            system_prompt=sys_prompt,
            model_id=model_id,
            temperature=temperature,
            max_tokens=max_tokens
        ):
            yield chunk

    async def generate_completion(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2
    ) -> str:
        """Non-streaming generation with live Hugging Face Inference API and Groq / OpenAI engine fallback."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        # 1. Try Hugging Face Inference
        token = settings.hf_api_token
        if not settings.DEMO_MODE and token:
            try:
                res = await asyncio.wait_for(
                    self.client.chat.completions.create(
                        model=model_id,
                        messages=messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=False
                    ),
                    timeout=8.0
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Live HF completion failed for {model_id} ({e}), trying Groq / OpenAI fallback.")

        # 2. Try Groq -> OpenAI gpt-4.1-mini fallback
        sys_msg = system_prompt or f"You are {model_id}, an open-weight foundation model deployed on the AgentHub decentralized compute network. Respond to the user with high accuracy."
        return await llm_service.generate_completion(
            prompt=prompt,
            system_prompt=sys_msg,
            temperature=temperature,
            max_tokens=max_tokens
        )


hf_service = HuggingFaceService()