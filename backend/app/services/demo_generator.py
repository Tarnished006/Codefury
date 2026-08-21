import asyncio
import random
import re
from typing import AsyncGenerator, Dict, Any, List

def synthesize_dynamic_response(model_id: str, prompt: str) -> List[str]:
    """Dynamically analyzes the user prompt and synthesizes a relevant, model-specialized answer."""
    prompt_clean = prompt.strip()
    p_lower = prompt_clean.lower()
    
    # 1. LLM / AI / Machine Learning Definition Prompts
    if any(k in p_lower for k in ["what is an llm", "what is a llm", "explain llm", "what is large language model", "what are llms"]):
        if model_id == "llama3":
            return [
                "A Large Language Model (LLM) is an advanced deep learning architecture based on the Transformer network, trained on massive textual datasets comprising hundreds of billions of parameters.\n\n",
                "Key characteristics of modern LLMs include:\n",
                "1. Self-Attention Mechanism: Dynamically weights the semantic importance of words across extensive context windows (up to 128k+ tokens).\n",
                "2. Autoregressive Generation: Predicts the next token probability distribution conditioned on preceding sequence history.\n",
                "3. Emergent Capabilities: Demonstrates zero-shot reasoning, in-context learning, semantic summarization, and instruction following after RLHF alignment.\n\n",
                "Popular foundational architectures include Llama 3, Mistral, and Claude, powering autonomous agent swarms and multimodal reasoning engines."
            ]
        elif model_id == "deepseek":
            return [
                "```python\n# Mathematical Transformer Token Formulation\nimport torch\nimport torch.nn as nn\n\nclass AttentionHead(nn.Module):\n    def __init__(self, d_model: int, d_k: int):\n        super().__init__()\n        self.q = nn.Linear(d_model, d_k)\n        self.k = nn.Linear(d_model, d_k)\n        self.v = nn.Linear(d_model, d_k)\n\n    def forward(self, x: torch.Tensor) -> torch.Tensor:\n        # Self-Attention: Softmax((Q * K^T) / sqrt(d_k)) * V\n        q, k, v = self.q(x), self.k(x), self.v(x)\n        scores = torch.matmul(q, k.transpose(-2, -1)) / (k.size(-1) ** 0.5)\n        weights = torch.softmax(scores, dim=-1)\n        return torch.matmul(weights, v)\n```\n",
                "LLMs utilize stacked multi-head self-attention and feed-forward layers to compute high-dimensional token embeddings for autoregressive token prediction."
            ]
        elif model_id == "mistral":
            return [
                "DEFINITION & ARCHITECTURAL SUMMARY:\n",
                "An LLM (Large Language Model) is a parameterized neural network designed for sequence-to-sequence language modeling and instruction following.\n\n",
                "Operational Pipeline:\n",
                "- Tokenization: Byte-Pair Encoding (BPE) mapping raw unicode text to integer vocabulary tokens.\n",
                "- Transformer Inference: Multi-layer attention and Rotary Position Embeddings (RoPE).\n",
                "- Function Calling: Structured JSON output schema enforcement for tool use and API integration.\n",
                "- Quantization: Execution across INT4/FP8 compute kernels for ultra-low latency inference."
            ]
        elif model_id == "biomedlm":
            return [
                "MEDICAL INFORMATICS PERSPECTIVE:\n",
                "In biomedical settings, an LLM is a domain-adapted neural foundation model trained on PubMed Central corpus and clinical EHR registries.\n",
                "- Enables automated clinical decision support (CDS) and pharmacovigilance tracking.\n",
                "- Validated against USMLE benchmark datasets for diagnostic contraindication screening."
            ]
        elif model_id == "fingpt":
            return [
                "FINANCIAL MARKET PERSPECTIVE:\n",
                "In quantitative finance, LLMs process 10-K regulatory filings, earnings call transcripts, and live Bloomberg news feeds to quantify market sentiment and systemic volatility shifts."
            ]
        else:
            return [
                f"A Large Language Model (LLM) is an artificial intelligence model trained on vast amounts of data using deep neural networks to understand and generate human-like text in response to '{prompt_clean}'."
            ]

    # 2. General Explanation / Definition Prompts
    if p_lower.startswith("what is") or p_lower.startswith("what are") or p_lower.startswith("explain") or p_lower.startswith("how does"):
        subject = re.sub(r"^(what is|what are|explain|how does|how to)\s+", "", prompt_clean, flags=re.IGNORECASE).rstrip("?")
        if model_id == "llama3":
            return [
                f"{subject.capitalize()} represents a foundational concept in computer science and artificial intelligence.\n\n",
                f"Core Principles of {subject}:\n",
                f"• Fundamental Purpose: Solves complex distributed systems and algorithmic workflows efficiently.\n",
                f"• Operational Workflow: Ingests input parameters, applies deterministic or probabilistic processing logic, and yields structured outputs.\n",
                f"• Scalability & Optimization: Designed for low-latency execution and seamless integration into modern infrastructure pipelines."
            ]
        elif model_id == "deepseek":
            return [
                f"```python\n# Optimized Implementation for {subject.capitalize()}\n",
                f"def solve_{re.sub(r'[^a-zA-Z0-9]', '_', subject.lower())}(input_data: dict) -> dict:\n",
                f"    \"\"\"Process {subject} with high-throughput streaming logic.\"\"\"\n",
                f"    result = {{'status': 'ACTIVE', 'target': '{subject}', 'processed': True}}\n",
                f"    return result\n```\n",
                f"Synthesized clean, production-ready algorithm for {subject}."
            ]
        elif model_id == "mistral":
            return [
                f"SYSTEM ANALYSIS: {subject.upper()}\n",
                f"1. Classification: High-priority domain task for '{prompt_clean}'.\n",
                f"2. Validation Rule: Passed boundary criteria with zero schema errors.\n",
                f"3. Execution Strategy: Modular pipeline with sub-40ms P50 SLA guarantees."
            ]
        else:
            return [
                f"Detailed analysis of {subject}: Synthesizing key technical specifications, operational boundaries, and performance benchmarks for '{prompt_clean}'."
            ]

    # 3. Coding & Software Prompts
    if any(k in p_lower for k in ["code", "python", "javascript", "function", "write", "build", "api", "endpoint", "database", "sql"]):
        return [
            f"```python\n# Production Implementation for: {prompt_clean}\n",
            "import asyncio\nfrom typing import Dict, Any\n\n",
            "async def handle_request(payload: Dict[str, Any]) -> Dict[str, Any]:\n",
            f"    # Process query: {prompt_clean[:40]}...\n",
            "    await asyncio.sleep(0.010)\n",
            "    return {'status': 'SUCCESS', 'data': payload, 'verified': True}\n```\n\n",
            f"Generated high-throughput implementation for '{prompt_clean}' with strict type safety and asynchronous non-blocking I/O."
        ]

    # 4. Default Dynamic Response echoing and answering user intent
    if model_id == "llama3":
        return [
            f"Analyzing query: \"{prompt_clean}\"\n\n",
            f"In response to your request, here is the comprehensive evaluation:\n",
            f"1. Core Analysis: Examining the primary parameters of '{prompt_clean}' across high-dimensional semantic space.\n",
            f"2. Strategic Assessment: Identifying optimal approaches for reliable, scalable execution.\n",
            f"3. Recommendation: Deploy modular sub-components with automated telemetry to ensure continuous verification."
        ]
    elif model_id == "deepseek":
        return [
            f"```python\n# Direct algorithmic resolution for: {prompt_clean}\n",
            f"def execute_task():\n",
            f"    query = \"{prompt_clean}\"\n",
            f"    return {{'query': query, 'status': 'COMPLETED', 'accuracy': 0.99}}\n```"
        ]
    elif model_id == "biomedlm":
        return [
            f"CLINICAL / BIOMEDICAL REVIEW for \"{prompt_clean}\":\n",
            f"• Evidence Level: Grade 1A clinical consensus.\n",
            f"• Interaction Profile: Validated against standard pharmacological indices with zero adverse warnings."
        ]
    elif model_id == "fingpt":
        return [
            f"QUANTITATIVE TELEMETRY for \"{prompt_clean}\":\n",
            f"• Variance Analysis: Baseline aligned with current market volatility.\n",
            f"• Risk Adjusted Alpha: +12.4% with neutral beta exposure."
        ]
    else:
        return [
            f"INSTRUCTION PIPELINE for \"{prompt_clean}\":\n",
            f"Verified input parameters, generated function signature, and structured response with 32k context boundary preserved."
        ]

async def generate_simulated_stream(model_id: str, prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
    """Streams dynamically generated, prompt-aware token chunks with realistic latency."""
    chunks = synthesize_dynamic_response(model_id, prompt)
    
    # Split into words/tokens
    tokens = []
    for chunk in chunks:
        words = chunk.split(" ")
        for i, word in enumerate(words):
            tokens.append(word + (" " if i < len(words) - 1 else ""))

    for i, token in enumerate(tokens):
        # 12-25ms per token stream interval
        await asyncio.sleep(random.uniform(0.012, 0.025))
        yield {
            "token": token,
            "index": i,
            "done": (i == len(tokens) - 1),
            "model_id": model_id
        }