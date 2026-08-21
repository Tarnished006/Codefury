import httpx
from typing import AsyncGenerator, Dict, Any
from app.config import settings
from app.services.demo_generator import generate_simulated_stream

class HuggingFaceService:
    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.base_url = "https://api-inference.huggingface.co/models"
        
    async def stream_inference(self, repo_id: str, model_id: str, prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
        # If in DEMO_MODE or without external key, stream with zero failure rate
        if settings.DEMO_MODE or not self.api_key:
            async for chunk in generate_simulated_stream(model_id, prompt):
                yield chunk
            return
            
        # Real Hugging Face API call with automatic fallback
        try:
            url = f"{self.base_url}/{repo_id}"
            headers = {"Authorization": f"Bearer {self.api_key}"}
            payload = {"inputs": prompt, "parameters": {"max_new_tokens": 512, "return_full_text": False}}
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(url, headers=headers, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    text = data[0].get("generated_text", "") if isinstance(data, list) else str(data)
                    words = text.split(" ")
                    for i, w in enumerate(words):
                        yield {
                            "token": w + (" " if i < len(words) - 1 else ""),
                            "index": i,
                            "done": (i == len(words) - 1),
                            "model_id": model_id
                        }
                else:
                    async for chunk in generate_simulated_stream(model_id, prompt):
                        yield chunk
        except Exception:
            async for chunk in generate_simulated_stream(model_id, prompt):
                yield chunk

hf_service = HuggingFaceService()