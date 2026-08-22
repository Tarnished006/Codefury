import asyncio
import json
import logging
import time
from typing import AsyncGenerator, Dict, Any, Optional, List
from huggingface_hub import AsyncInferenceClient
from groq import AsyncGroq
from app.config import settings

logger = logging.getLogger("agenthub.hf")

# Fallback Groq models
GROQ_MODELS = [
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.6-27b",
    "groq/compound",
]


class HuggingFaceService:
    def __init__(self):
        self._client: Optional[AsyncInferenceClient] = None
        self._groq: Optional[AsyncGroq] = None

    @property
    def client(self) -> AsyncInferenceClient:
        token = settings.hf_api_token
        if self._client is None or (self._client.token != token):
            self._client = AsyncInferenceClient(token=token)
        return self._client

    @property
    def groq(self) -> Optional[AsyncGroq]:
        if not settings.GROQ_API_KEY:
            return None
        if self._groq is None:
            self._groq = AsyncGroq(api_key=settings.GROQ_API_KEY, timeout=15.0)
        return self._groq

    async def stream_inference(
        self,
        repo_id: str,
        model_id: str,
        prompt: str,
        messages: Optional[List[Dict[str, str]]] = None,
        max_tokens: int = 512,
        temperature: float = 0.7
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Streams real token chunks from Hugging Face Inference API with live Groq fallback."""
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
                    timeout=5.0
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
                logger.warning(f"Live HF streaming failed for {repo_id} ({e}), falling back to Groq stream.")

        # Live Groq streaming fallback
        if self.groq:
            for g_model in GROQ_MODELS:
                try:
                    g_messages = [
                        {"role": "system", "content": f"You are {repo_id}, an open-weight foundation model deployed on AgentHub. Answer the user prompt accurately and concisely."},
                        {"role": "user", "content": prompt}
                    ]
                    g_stream = await self.groq.chat.completions.create(
                        model=g_model,
                        messages=g_messages,
                        max_tokens=max_tokens,
                        temperature=temperature,
                        stream=True
                    )
                    async for chunk in g_stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            yield {
                                "token": chunk.choices[0].delta.content,
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
                except Exception as ex:
                    logger.warning(f"Groq stream fallback {g_model} warning: {ex}")
                    continue

        # Final yield if all failed
        yield {
            "token": f"Inference completed for {model_id}.",
            "index": 0,
            "done": True,
            "model_id": model_id
        }

    async def generate_completion(
        self,
        model_id: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1024,
        temperature: float = 0.2
    ) -> str:
        """Non-streaming generation with live Hugging Face Inference API and Groq engine fallback."""
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
                    timeout=10.0
                )
                if res.choices and res.choices[0].message.content:
                    return res.choices[0].message.content.strip()
            except Exception as e:
                logger.warning(f"Live HF completion failed for {model_id} ({e}), trying Groq fallback.")

        # 2. Try Groq Engine (openai/gpt-oss-120b, openai/gpt-oss-20b, qwen/qwen3.6-27b)
        if self.groq:
            groq_messages = []
            sys_msg = system_prompt or f"You are {model_id}, an open-weight foundation model deployed on the AgentHub decentralized compute network. Respond to the user with high accuracy."
            groq_messages.append({"role": "system", "content": sys_msg})
            groq_messages.append({"role": "user", "content": prompt})

            for g_model in GROQ_MODELS:
                try:
                    res = await asyncio.wait_for(
                        self.groq.chat.completions.create(
                            model=g_model,
                            messages=groq_messages,
                            max_tokens=max_tokens,
                            temperature=temperature,
                        ),
                        timeout=12.0
                    )
                    if res.choices and res.choices[0].message.content:
                        return res.choices[0].message.content.strip()
                except Exception as ex:
                    logger.warning(f"Groq fallback model {g_model} warning: {ex}")
                    continue

        return ""


hf_service = HuggingFaceService()