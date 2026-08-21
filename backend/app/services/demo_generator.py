import asyncio
import json
import random
from typing import AsyncGenerator, Dict, Any

MODEL_RESPONSES = {
    "llama3": [
        "Based on your requirements, the architecture should be organized into decoupled micro-services.",
        " First, initialize the high-throughput gateway layer with rate-limiting and JWT authentication.",
        " Next, deploy the asynchronous worker pool using event-driven message brokers for batch processing.",
        " Finally, configure distributed telemetry with OpenTelemetry and Prometheus to maintain sub-40ms P50 latency across all active GPU clusters."
    ],
    "deepseek": [
        "```python\n# Optimized Autonomous Task Router\nimport asyncio\nfrom typing import Dict, Any\n\nclass InferenceMeshRouter:\n    def __init__(self, cluster_id: str):\n        self.cluster_id = cluster_id\n        self.active_workers = 8\n        \n    async def dispatch_task(self, payload: Dict[str, Any]) -> Dict[str, Any]:\n        # Execute zero-latency stream dispatch\n        await asyncio.sleep(0.038)\n        return {'status': 'SUCCESS', 'throughput': '142.8M tok/day'}\n```"
    ],
    "biomedlm": [
        "CLINICAL PHARMACOLOGY REVIEW:\n",
        "- Analysis of target compound interactions demonstrates minimal CYP3A4 pathway inhibition.\n",
        "- Bioavailability index: 94.2% across baseline cohorts.\n",
        "- Recommended dosing protocol: 25mg q.d. with renal clearance monitoring at 14-day intervals.\n",
        "- Evidence Level: Grade 1A meta-analysis consensus."
    ],
    "llava": [
        "MULTIMODAL VISION DECOMPOSITION:\n",
        "1. Primary Subject: High-density GPU cluster chassis with 8x NVIDIA H100 NVLink interconnects.\n",
        "2. Thermal & Optical Status: Active cooling liquid manifolds operating at 42°C nominal.\n",
        "3. Semantic Segment: All 8 PCIe 5.0 lanes identified with zero parity degradation detected."
    ],
    "fingpt": [
        "QUANTITATIVE FINANCIAL FORECAST & AUDIT:\n",
        "• Macro Volatility (VIX): 14.8 [Neutral Low Risk]\n",
        "• Projected Q4 Revenue Elasticity: +18.4% (95% CI: 16.2% - 21.1%)\n",
        "• Balance Sheet Liquidity Ratio: 3.42x Quick Assets\n",
        "• Risk Mitigation Strategy: Delta-neutral hedging over 30-day options skew."
    ],
    "mistral": [
        "FUNCTION EXECUTION PIPELINE:\n",
        "Calling registered tool: `execute_sql_migration(target='prod_db', mode='safe')`\n",
        "Schema validation: Passed (12 tables indexed, 0 locks acquired).\n",
        "Response payload dispatched with 32k context boundary preserved."
    ]
}

async def generate_simulated_stream(model_id: str, prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
    """Streams realistic token chunks with natural latency intervals."""
    chunks = MODEL_RESPONSES.get(model_id, MODEL_RESPONSES["llama3"])
    
    # Split chunks into word tokens
    tokens = []
    for chunk in chunks:
        words = chunk.split(" ")
        for i, word in enumerate(words):
            tokens.append(word + (" " if i < len(words) - 1 else ""))

    for i, token in enumerate(tokens):
        # Simulated streaming delay: 15-40ms per token
        await asyncio.sleep(random.uniform(0.015, 0.040))
        yield {
            "token": token,
            "index": i,
            "done": (i == len(tokens) - 1),
            "model_id": model_id
        }