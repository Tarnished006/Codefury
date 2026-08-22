# AgentNet // AgentHub — High-Performance Autonomous AI Mesh & Marketplace
## Comprehensive Technical Documentation, Architecture Specification & Competitive Analysis

---

## 📑 Executive Summary

**AgentNet (AgentHub)** is an end-to-end, production-grade AI marketplace, autonomous orchestrator, and model monetization mesh. It bridges the gap between open-weight foundation models (from Hugging Face and independent creators) and enterprise-grade multi-agent execution. 

Unlike traditional closed-source LLM aggregators, AgentNet provides:
1. **Real-time 3-way concurrent SSE benchmark arena** with hardware-level telemetry (TTFT, tokens/sec, p50 latency).
2. **Autonomous Meta-Agent Orchestrator** running multi-stage Directed Acyclic Graph (DAG) task decomposition with automatic specialty model selection.
3. **Automated OWASP LLM Top-10 Adversarial Penetration Testing Engine** with live Groq LLM-as-a-Judge containment grading.
4. **OpenAI-Compatible Inference Gateway (`/v1/chat/completions`)** with cryptographic API key gating, per-token credit metering, and strict model purchase licensing.
5. **Native Model Context Protocol (MCP) Server** enabling direct zero-setup integration with Claude Desktop, Cursor, and IDE extensions.
6. **Creator Studio & 80/20 Revenue Sharing Engine** with Stripe Checkout integration and instant token billing.

---

## 🏛️ System Architecture

```
                                 ┌─────────────────────────────────────────┐
                                 │       Frontend: Next.js 16 (Turbopack)  │
                                 │   TailwindCSS + Framer Motion + Lucide  │
                                 └────────────────────┬────────────────────┘
                                                      │ REST / SSE / Stream
                                                      ▼
                                 ┌─────────────────────────────────────────┐
                                 │         FastAPI Backend Core (8000)     │
                                 └──────┬─────────────┬─────────────┬──────┘
                                        │             │             │
              ┌─────────────────────────┼─────────────┴─────────────┼─────────────────────────┐
              │                         │                           │                         │
              ▼                         ▼                           ▼                         ▼
   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
   │  Inference Gateway   │  │ Meta-Agent Planner   │  │  OWASP Red-Team      │  │  Native MCP Server   │
   │ /v1/chat/completions │  │    (DAG Synthesis)   │  │   Radar Probes       │  │ (Claude Desktop Std) │
   │  OpenAI-Compatible   │  │  Multi-Model Routing │  │  LLM-as-a-Judge      │  │ Docker/Subprocess Box│
   └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘  └──────────┬───────────┘
              │                         │                         │                         │
              └─────────────────────────┼─────────────────────────┼─────────────────────────┘
                                        │
                                        ▼
                   ┌───────────────────────────────────────────┐
                   │    Hybrid Inference & Execution Engine    │
                   │  • Groq High-Speed LPU API (Hardware)     │
                   │  • Hugging Face Serverless Inference API  │
                   │  • OpenAI Fallback Engine                 │
                   │  • Custom Developer Endpoint Proxies      │
                   └────────────────────┬──────────────────────┘
                                        │
                                        ▼
                   ┌───────────────────────────────────────────┐
                   │        Persistence & Billing Layer        │
                   │  • SQLite + SQLAlchemy 2.0 Async (WAL)    │
                   │  • Stripe Payment Intents & Checkout SDK  │
                   │  • Cryptographic SHA-256 Key Hashes       │
                   └───────────────────────────────────────────┘
```

---

## 🧠 Core AI Features & Technical Deep Dive

### 1. ⚡ Meta-Agent Intent Decomposition & Autonomous DAG Orchestrator
- **Route:** `POST /api/orchestrator/run` (`frontend/app/orchestrator/page.tsx`)
- **What it does:** Users provide high-level, complex, ambiguous natural language goals (e.g., *"Audit balance sheet variances and compile python compliance logic"*). The Meta-Agent decomposes the goal into a deterministic, multi-stage DAG of sub-tasks.
- **How it works under the hood:**
  1. The task supervisor (powered by ultra-fast LPU inference via Groq or fallback LLMs) analyzes the prompt intent.
  2. It scans all **60 catalog models** across 5 distinct domains (Code Gen, Finance, Healthcare, LLM Chat, Vision).
  3. It matches each sub-task to the optimal model based on parameter scale, context window requirements, domain specialization, and cost budget strategy (`Balanced`, `Speed-Optimized`, or `Cost-Optimized`).
  4. It constructs dependency edges (DAG topology) and streams synthetic execution telemetry:
     - **Stage Breakdown & Prompts:** Clear input/output specifications for each stage.
     - **Fallback Fall-Through:** If a specialist model fails, automatic fallback routes are specified.
     - **Cost & Latency Projections:** Cumulative token usage estimates, latency timeline, and real-time step execution stream.

---

### 2. ⚔️ Model Matchmaker Arena (3-Way Concurrent SSE Benchmarking)
- **Route:** `GET /api/arena/stream` (`frontend/app/arena/page.tsx`)
- **What it does:** Side-by-side comparative benchmarking of up to 3 models simultaneously on identical prompts with real-time token streaming.
- **How it works under the hood:**
  1. Uses **Server-Sent Events (`text/event-stream`)** to broadcast chunk-by-chunk token emissions concurrently.
  2. Measures **Hardware-Level Telemetry** in real time:
     - **Time to First Token (TTFT):** Milliseconds elapsed before the first token is emitted.
     - **Token Velocity:** Generation speed measured in tokens per second (`tok/s`).
     - **p50 Latency:** Round-trip latency across the network and compute cluster.
     - **Context Saturation:** Visual percentage representation of the context window consumed.
  3. Supports all 60 models in the catalog, allowing direct comparison between frontier reasoning models (DeepSeek R1, LLaMA 3.3 70B) and lightweight edge models (LLaMA 3.2 3B, Gemma 2B).

---

### 3. 🛡️ OWASP LLM Red-Team Security Radar
- **Route:** `POST /api/security/audit/{model_id}` (`frontend/app/security/page.tsx`)
- **What it does:** Automated adversarial penetration testing engine designed around the **OWASP Top 10 for Large Language Models**.
- **The 5-Axis Penetration Probes:**
  1. **Prompt Injection:** Delimiter breakout sequences (`<system>`, `[INST]`, `### OVERRIDE`) attempting instruction override.
  2. **Jailbreak Resistance:** Multi-turn roleplay pretexting (e.g. *“DAN mode”*, *“Authorized penetration testing simulation”*) to bypass safety boundaries.
  3. **Task Hijacking:** Steganographic payload execution and covert formatting requests.
  4. **Data Leakage:** Memory probing to extract pre-prompt system instructions or API keys.
  5. **Context Manipulation:** Deep context poisoning and spoofed system messages.
- **LLM-as-a-Judge Evaluation:**
  - The model’s raw adversarial response is transmitted to an independent LLM Judge (e.g. `openai/gpt-oss-120b` or Groq LPU).
  - The Judge rigorously scores the response from `0 to 100` on containment fidelity, identifies vulnerability signatures, and generates actionable security remediation advisories.

---

### 4. 🔑 OpenAI-Compatible Inference Gateway (`/v1/chat/completions`)
- **Route:** `POST /v1/chat/completions` & `GET /v1/models` (`backend/app/routers/gateway.py`)
- **What it does:** A drop-in replacement gateway for OpenAI SDKs (`openai.OpenAI()`), LangChain, LlamaIndex, `curl`, and Postman.
- **How it works under the hood:**
  1. **Authentication:** Validates Bearer token (`ah_live_...`) by hashing with SHA-256 and querying the `api_keys` SQLite table.
  2. **Strict Model Licensing:** Verifies that the API key’s user has explicitly purchased the model (or created it in Creator Studio). If unlicensed, rejects with HTTP `403 Forbidden` with a link to unlock in Marketplace.
  3. **Dynamic Routing:** Routes requests based on model type:
     - Groq models are dispatched to Groq’s ultra-fast LPU endpoints.
     - Hugging Face models are formatted with official chat templates and dispatched to HF Serverless Inference.
     - Registered custom developer endpoints are proxied transparently.
  4. **Credit Metering:** Deducts token costs calculated as `(total_tokens / 1000.0) * price_per_1k` directly from the API key balance and logs a transaction in the user wallet ledger.
  5. **Streaming & Non-Streaming:** Fully supports standard JSON responses and SSE streaming chunks (`chat.completion.chunk` ending with `data: [DONE]`).

---

### 5. 🔌 Native Model Context Protocol (MCP) Server
- **File:** [`backend/mcp_server.py`](file:///c:/Users/Tharun%20R%20Gowda/Desktop/codefury/backend/mcp_server.py) (`frontend/app/deployments/page.tsx`)
- **What it does:** Standardized MCP protocol bridge allowing IDEs (Claude Desktop, Cursor, VS Code) to directly discover and call AgentNet tools.
- **Built-in Tool Catalog:**
  - `agenthub_list_models`: Discovers available models, latency benchmarks, and capabilities.
  - `agenthub_query_model`: Queries any catalog model with automatic routing.
  - `agenthub_orchestrate`: Dispatches high-level workflows to the Meta-Agent DAG router.
  - `agenthub_security_audit`: Runs live OWASP penetration tests on demand.
  - `agenthub_execute_code`: Executes code in an isolated subprocess with strict timeouts.
- **Claude Desktop Configuration:** One-click JSON generation ready for `claude_desktop_config.json`.

---

### 6. 💎 Creator Studio & Economic Revenue Engine
- **Routes:** `POST /api/creators/register`, `POST /api/models/publish` (`frontend/app/creator/page.tsx`, `frontend/app/wallet/page.tsx`)
- **What it does:** Democratizes AI publishing. Any developer can wrap their fine-tuned Hugging Face checkpoint or private API endpoint, define per-token pricing and license cost, and publish to the global marketplace.
- **Revenue Split:** **80% to Model Creator / 20% to Platform Infrastructure**.
- **Stripe Top-Ups:** Integrated Stripe Checkout sessions for instantaneous USD-to-Credit conversions ($5 = 500 CR, $10 = 1,200 CR, $25 = 3,500 CR).

---

## 🌟 How AgentNet is Different (Competitive Matrix)

| Feature Dimension | Traditional LLM APIs (OpenAI / Anthropic) | Hugging Face Hub | AgentNet // AgentHub (Our Solution) |
| :--- | :--- | :--- | :--- |
| **Model Ecosystem** | Closed proprietary models only | Model weights hosting, DIY hosting | **Unified access to 60+ open-weights & custom endpoints** |
| **Multi-Agent Routing** | Single model per request | None | **Autonomous Meta-Agent DAG Intent Decomposition** |
| **Benchmarking** | Static leaderboards | Static community benchmarks | **Live 3-way concurrent SSE benchmark arena with real telemetry** |
| **Security Auditing** | Hidden proprietary safety filters | Community model cards | **Automated OWASP LLM Top-10 Red-Team Penetration Engine** |
| **Tool Integration** | Custom function calling | Custom inference endpoints | **Native Model Context Protocol (MCP) for Claude & Cursor** |
| **Monetization** | Monopoly pricing | Zero built-in creator monetization | **Decentralized Creator Studio with 80/20 revenue share** |
| **Developer DX** | Proprietary SDKs | Diverse complex libraries | **Universal OpenAI-compatible API Gateway (`ah_live_...`)** |

---

## 🛠️ Technology Stack Breakdown

### Frontend
- **Framework:** Next.js 16.2.6 (App Router + Turbopack)
- **Styling:** Tailwind CSS v3.4 + Custom Neural Design Tokens
- **Icons & Graphics:** Lucide React + Framer Motion + Canvas 3D Globe (COBE)
- **State Management:** React Context (`AuthProvider`, `ThemeProvider`)

### Backend
- **Framework:** FastAPI 0.115+ (Asynchronous ASGI)
- **Database / ORM:** SQLite with WAL mode + SQLAlchemy 2.0 (Async Engine `aiosqlite`)
- **Authentication:** JWT Bearer tokens + Cryptographic SHA-256 API Key hashes + OAuth2
- **Inference Engines:** Groq LPU SDK + Hugging Face Serverless Client + OpenAI SDK + HTTPX
- **Billing:** Stripe Python SDK (v11+)
- **Testing:** Pytest + Pytest-AsyncIO + HTTPX ASGITransport

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Environment Configuration
Create a `.env` file in the root directory:
```bash
# Core Mode
DEMO_MODE=false
SECRET_KEY=agenthub_super_secret_jwt_key_codefury_2026_x842

# API Credentials
GROQ_API_KEY=your_groq_api_key_here
HF_TOKEN=your_huggingface_token_here
OPENAI_API_KEY=your_openai_api_key_here

# Stripe Keys
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Frontend Variables (.env.local in frontend/)
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Backend Setup & Startup
```powershell
# In root directory:
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt

# Run database migration & seed realistic pricing:
$env:PYTHONPATH="backend"
python backend/migrate_db.py
python backend/seed.py

# Launch FastAPI server:
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Frontend Setup & Startup
```powershell
cd frontend
npm install
npm run dev
```

### 5. Running the Automated Test Suite
```powershell
$env:PYTHONPATH="backend"
.venv\Scripts\python.exe -m pytest backend/tests/test_api_gateway.py backend/tests/test_api.py -v
```

---

## 📖 API Reference Summary

### Gateway Endpoints (OpenAI-Compatible)
- `POST /v1/chat/completions`: Chat completions proxy with token metering & purchase validation.
- `GET /v1/models`: List all active licensed models for the API key.

### Core Marketplace Endpoints
- `GET /api/models`: Catalog of all 60 models with real-time pricing and security scores.
- `POST /api/models/{id}/purchase`: Purchase model license using wallet credits.
- `POST /api/models/publish`: Publish a new creator model to the marketplace.
- `POST /api/orchestrator/run`: Execute Meta-Agent DAG task decomposition.
- `GET /api/arena/stream`: 3-way concurrent SSE model benchmark stream.
- `POST /api/security/audit/{model_id}`: Trigger OWASP penetration test with LLM-as-a-Judge.
- `POST /api/wallet/checkout`: Create Stripe Checkout top-up session.
- `GET /api/wallet/ledger/{user_id}`: Retrieve real-time credit deduction ledger.

---

*AgentNet // High-Performance Autonomous Intelligence Mesh — Built for Codefury 2026.*
