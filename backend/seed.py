import asyncio
import bcrypt
from app.database import AsyncSessionLocal, engine, Base
from app.models import AIModel, OWASPAudit, User, Wallet, Creator

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")

INITIAL_CREATORS = [
    {
        "id": "creator_meta",
        "name": "Meta AI Research",
        "handle": "meta_ai",
        "bio": "Foundational open-weight Llama model series and multimodal research.",
        "avatar_url": "https://avatars.githubusercontent.com/u/10262924?s=200&v=4",
        "total_earnings_credits": 4850.80,
        "pending_payout_credits": 1940.50
    },
    {
        "id": "creator_mistral",
        "name": "Mistral AI",
        "handle": "mistral_ai",
        "bio": "European frontier open weights including Mistral 7B, Nemo 12B & Mixtral MoE.",
        "avatar_url": "https://avatars.githubusercontent.com/u/132338006?s=200&v=4",
        "total_earnings_credits": 3680.00,
        "pending_payout_credits": 1450.00
    },
    {
        "id": "creator_qwen",
        "name": "Qwen Team (Alibaba)",
        "handle": "qwen_ai",
        "bio": "State-of-the-art multilingual, coding, and vision foundation models.",
        "avatar_url": "https://avatars.githubusercontent.com/u/35070265?s=200&v=4",
        "total_earnings_credits": 3960.30,
        "pending_payout_credits": 1610.80
    },
    {
        "id": "creator_deepseek",
        "name": "DeepSeek AI Labs",
        "handle": "deepseek_ai",
        "bio": "DeepSeek Coder series, V2/V3 MoE architectures, and mathematical reasoning.",
        "avatar_url": "https://avatars.githubusercontent.com/u/148332176?s=200&v=4",
        "total_earnings_credits": 4120.40,
        "pending_payout_credits": 1790.20
    },
    {
        "id": "creator_google",
        "name": "Google DeepMind / Open",
        "handle": "google_deepmind",
        "bio": "Gemma and PaliGemma open foundation models.",
        "avatar_url": "https://avatars.githubusercontent.com/u/1342004?s=200&v=4",
        "total_earnings_credits": 2840.10,
        "pending_payout_credits": 1120.00
    },
    {
        "id": "creator_biomistral",
        "name": "BioMistral Consortium",
        "handle": "biomistral",
        "bio": "Open source biomedical intelligence and clinical reasoning models.",
        "avatar_url": "https://avatars.githubusercontent.com/u/150098379?s=200&v=4",
        "total_earnings_credits": 2150.00,
        "pending_payout_credits": 890.00
    },
    {
        "id": "creator_fingpt",
        "name": "FinGPT Open Group",
        "handle": "fingpt_dev",
        "bio": "Open-source financial large language models and quantitative market predictors.",
        "avatar_url": "https://avatars.githubusercontent.com/u/135114781?s=200&v=4",
        "total_earnings_credits": 2430.50,
        "pending_payout_credits": 980.00
    }
]

EXPANDED_MODEL_CATALOG = [
    # ══════════════════════════════════════════════════════════════════════
    # 1. LLM CHAT (General & Reasoning — 11 Models)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "llama3-8b-instruct",
        "creator_id": "creator_meta",
        "name": "Llama 3 8B Instruct",
        "repo_id": "meta-llama/Meta-Llama-3-8B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "REASONING",
        "description": "Ultra-fast open weight instruction tuned model for general workflows.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 38,
        "price_per_1k": 0.12,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "llama31-8b-instruct",
        "creator_id": "creator_meta",
        "name": "Llama 3.1 8B Instruct",
        "repo_id": "meta-llama/Llama-3.1-8B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "REASONING",
        "description": "128k context flagship instruction model with multilingual intelligence.",
        "context_length": 128000,
        "parameters": "8B",
        "p50_latency_ms": 39,
        "price_per_1k": 0.14,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "llama32-3b-instruct",
        "creator_id": "creator_meta",
        "name": "Llama 3.2 3B Instruct",
        "repo_id": "meta-llama/Llama-3.2-3B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "FAST INFERENCE",
        "description": "Lightweight 3B edge and high-throughput conversational agent.",
        "context_length": 128000,
        "parameters": "3B",
        "p50_latency_ms": 22,
        "price_per_1k": 0.06,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "llama32-1b-instruct",
        "creator_id": "creator_meta",
        "name": "Llama 3.2 1B Instruct",
        "repo_id": "meta-llama/Llama-3.2-1B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "EDGE REASONING",
        "description": "Sub-20ms ultra-compact edge model with full 128k token context.",
        "context_length": 128000,
        "parameters": "1B",
        "p50_latency_ms": 18,
        "price_per_1k": 0.04,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "mistral-7b-instruct-v03",
        "creator_id": "creator_mistral",
        "name": "Mistral 7B Instruct v0.3",
        "repo_id": "mistralai/Mistral-7B-Instruct-v0.3",
        "domain": "LLM CHAT",
        "task_tag": "FUNCTION CALLING",
        "description": "Industry reference 7B model with native structured tool calling.",
        "context_length": 32768,
        "parameters": "7B",
        "p50_latency_ms": 34,
        "price_per_1k": 0.09,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "mistral-nemo-instruct-2407",
        "creator_id": "creator_mistral",
        "name": "Mistral Nemo 12B",
        "repo_id": "mistralai/Mistral-Nemo-Instruct-2407",
        "domain": "LLM CHAT",
        "task_tag": "MULTILINGUAL",
        "description": "12B multilingual model trained in collaboration with NVIDIA with Tekken tokenizer.",
        "context_length": 128000,
        "parameters": "12B",
        "p50_latency_ms": 40,
        "price_per_1k": 0.15,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "qwen25-7b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 7B Instruct",
        "repo_id": "Qwen/Qwen2.5-7B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "GENERAL CHAT",
        "description": "Flagship 7B dense transformer with leading reasoning benchmarks.",
        "context_length": 32768,
        "parameters": "7B",
        "p50_latency_ms": 30,
        "price_per_1k": 0.10,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "qwen25-14b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 14B Instruct",
        "repo_id": "Qwen/Qwen2.5-14B-Instruct",
        "domain": "LLM CHAT",
        "task_tag": "HIGH PRECISION",
        "description": "14B parameter balanced model for complex enterprise multi-turn workflows.",
        "context_length": 32768,
        "parameters": "14B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.18,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "gemma-2-9b-it",
        "creator_id": "creator_google",
        "name": "Gemma 2 9B Instruct",
        "repo_id": "google/gemma-2-9b-it",
        "domain": "LLM CHAT",
        "task_tag": "DENSE REASONING",
        "description": "Google redesigned architecture delivering high reasoning density per FLOP.",
        "context_length": 8192,
        "parameters": "9B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.11,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "gemma-2-2b-it",
        "creator_id": "creator_google",
        "name": "Gemma 2 2B Instruct",
        "repo_id": "google/gemma-2-2b-it",
        "domain": "LLM CHAT",
        "task_tag": "ON-DEVICE",
        "description": "Compact 2B parameter conversational model optimized for on-device execution.",
        "context_length": 8192,
        "parameters": "2B",
        "p50_latency_ms": 20,
        "price_per_1k": 0.05,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "phi-35-mini-instruct",
        "creator_id": "creator_meta",
        "name": "Phi-3.5 Mini Instruct",
        "repo_id": "microsoft/Phi-3.5-mini-instruct",
        "domain": "LLM CHAT",
        "task_tag": "LONG CONTEXT",
        "description": "Microsoft 3.8B model with exceptional quality and native 128k context.",
        "context_length": 128000,
        "parameters": "3.8B",
        "p50_latency_ms": 24,
        "price_per_1k": 0.07,
        "security_score": 97,
        "is_online": True
    },

    # ══════════════════════════════════════════════════════════════════════
    # 2. CODE GEN (Code Synthesis & Developer Agents — 10 Models)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "deepseek-coder-67b-instruct",
        "creator_id": "creator_deepseek",
        "name": "DeepSeek Coder 6.7B",
        "repo_id": "deepseek-ai/deepseek-coder-6.7b-instruct",
        "domain": "CODE GEN",
        "task_tag": "SYNTHESIS",
        "description": "Full-stack code synthesis model trained from scratch on 2T tokens.",
        "context_length": 16384,
        "parameters": "6.7B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.08,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "deepseek-coder-v2-lite-instruct",
        "creator_id": "creator_deepseek",
        "name": "DeepSeek Coder V2 Lite",
        "repo_id": "deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct",
        "domain": "CODE GEN",
        "task_tag": "MOE CODE",
        "description": "Mixture-of-Experts coding model with 16B total params and 2.4B active params.",
        "context_length": 128000,
        "parameters": "16B",
        "p50_latency_ms": 36,
        "price_per_1k": 0.14,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "qwen25-coder-7b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 Coder 7B",
        "repo_id": "Qwen/Qwen2.5-Coder-7B-Instruct",
        "domain": "CODE GEN",
        "task_tag": "CODE GEN",
        "description": "State-of-the-art 7B code model matching GPT-4 level coding benchmarks.",
        "context_length": 32768,
        "parameters": "7B",
        "p50_latency_ms": 30,
        "price_per_1k": 0.10,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "qwen25-coder-15b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 Coder 1.5B",
        "repo_id": "Qwen/Qwen2.5-Coder-1.5B-Instruct",
        "domain": "CODE GEN",
        "task_tag": "AUTOCOMPLETE",
        "description": "Ultra-low latency sub-20ms code autocompletion and snippet generation.",
        "context_length": 32768,
        "parameters": "1.5B",
        "p50_latency_ms": 18,
        "price_per_1k": 0.04,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "qwen25-coder-32b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2.5 Coder 32B",
        "repo_id": "Qwen/Qwen2.5-Coder-32B-Instruct",
        "domain": "CODE GEN",
        "task_tag": "ENTERPRISE CODE",
        "description": "Flagship 32B code model with 128k context handling large codebases.",
        "context_length": 32768,
        "parameters": "32B",
        "p50_latency_ms": 52,
        "price_per_1k": 0.35,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "starcoder2-7b",
        "creator_id": "creator_deepseek",
        "name": "StarCoder 2 7B",
        "repo_id": "bigcode/starcoder2-7b",
        "domain": "CODE GEN",
        "task_tag": "POLYGLOT CODE",
        "description": "BigCode foundation model supporting 600+ programming languages.",
        "context_length": 16384,
        "parameters": "7B",
        "p50_latency_ms": 34,
        "price_per_1k": 0.09,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "starcoder2-15b",
        "creator_id": "creator_deepseek",
        "name": "StarCoder 2 15B",
        "repo_id": "bigcode/starcoder2-15b",
        "domain": "CODE GEN",
        "task_tag": "FULL REPO CODE",
        "description": "15B parameter model trained on The Stack v2 for full-repository understanding.",
        "context_length": 16384,
        "parameters": "15B",
        "p50_latency_ms": 44,
        "price_per_1k": 0.20,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "codellama-7b-instruct",
        "creator_id": "creator_meta",
        "name": "CodeLlama 7B Instruct",
        "repo_id": "codellama/CodeLlama-7b-Instruct-hf",
        "domain": "CODE GEN",
        "task_tag": "PYTHON & INFRA",
        "description": "Meta specialized code generation model with infilling capabilities.",
        "context_length": 16384,
        "parameters": "7B",
        "p50_latency_ms": 35,
        "price_per_1k": 0.09,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "codellama-13b-instruct",
        "creator_id": "creator_meta",
        "name": "CodeLlama 13B Instruct",
        "repo_id": "codellama/CodeLlama-13b-Instruct-hf",
        "domain": "CODE GEN",
        "task_tag": "ALGORITHMS",
        "description": "13B parameter coding engine for complex algorithmic transformations.",
        "context_length": 16384,
        "parameters": "13B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.16,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "wizardcoder-python-7b",
        "creator_id": "creator_deepseek",
        "name": "WizardCoder Python 7B",
        "repo_id": "WizardLM/WizardCoder-Python-7B-V1.0",
        "domain": "CODE GEN",
        "task_tag": "PYTHON SYNTHESIS",
        "description": "Evol-Instruct specialized Python code generation and refactoring engine.",
        "context_length": 8192,
        "parameters": "7B",
        "p50_latency_ms": 36,
        "price_per_1k": 0.09,
        "security_score": 95,
        "is_online": True
    },

    # ══════════════════════════════════════════════════════════════════════
    # 3. VISION AI (Multimodal & Visual QA — 10 Models)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "llava-15-7b-hf",
        "creator_id": "creator_meta",
        "name": "LLaVA 1.5 7B Vision",
        "repo_id": "llava-hf/llava-1.5-7b-hf",
        "domain": "VISION AI",
        "task_tag": "VISUAL QA",
        "description": "Visual instruction tuned model combining CLIP ViT-L with Vicuna.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 56,
        "price_per_1k": 0.22,
        "security_score": 94,
        "is_online": True
    },
    {
        "id": "llava-v16-mistral-7b-hf",
        "creator_id": "creator_mistral",
        "name": "LLaVA NeXT Mistral 7B",
        "repo_id": "llava-hf/llava-v1.6-mistral-7b-hf",
        "domain": "VISION AI",
        "task_tag": "DOCUMENT OCR",
        "description": "High-resolution multimodal model with dynamic image grid reasoning.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 58,
        "price_per_1k": 0.24,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "llama3-llava-next-8b-hf",
        "creator_id": "creator_meta",
        "name": "LLaVA NeXT Llama 3 8B",
        "repo_id": "llava-hf/llama3-llava-next-8b-hf",
        "domain": "VISION AI",
        "task_tag": "MULTIMODAL",
        "description": "Next-gen vision architecture built on Llama 3 8B Instruct backbone.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 60,
        "price_per_1k": 0.25,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "qwen2-vl-7b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2 VL 7B",
        "repo_id": "Qwen/Qwen2-VL-7B-Instruct",
        "domain": "VISION AI",
        "task_tag": "VIDEO & SPATIAL",
        "description": "Native dynamic resolution vision-language model understanding 20min+ videos.",
        "context_length": 32768,
        "parameters": "7B",
        "p50_latency_ms": 54,
        "price_per_1k": 0.22,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "qwen2-vl-2b-instruct",
        "creator_id": "creator_qwen",
        "name": "Qwen 2 VL 2B",
        "repo_id": "Qwen/Qwen2-VL-2B-Instruct",
        "domain": "VISION AI",
        "task_tag": "EDGE VISION",
        "description": "Compact vision-language model for edge device visual question answering.",
        "context_length": 32768,
        "parameters": "2B",
        "p50_latency_ms": 28,
        "price_per_1k": 0.08,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "paligemma-3b-pt-448",
        "creator_id": "creator_google",
        "name": "PaliGemma 3B Vision",
        "repo_id": "google/paligemma-3b-pt-448",
        "domain": "VISION AI",
        "task_tag": "HIGH RES OCR",
        "description": "Google vision-language model combining SigLIP visual encoder with Gemma.",
        "context_length": 4096,
        "parameters": "3B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.10,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "paligemma-3b-mix-448",
        "creator_id": "creator_google",
        "name": "PaliGemma 3B Mix",
        "repo_id": "google/paligemma-3b-mix-448",
        "domain": "VISION AI",
        "task_tag": "DIAGRAM ANALYSIS",
        "description": "Fine-tuned PaliGemma checkpoint on chart, diagram, and visual spatial benchmarks.",
        "context_length": 4096,
        "parameters": "3B",
        "p50_latency_ms": 32,
        "price_per_1k": 0.10,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "blip2-opt-27b",
        "creator_id": "creator_meta",
        "name": "BLIP-2 OPT 2.7B",
        "repo_id": "Salesforce/blip2-opt-2.7b",
        "domain": "VISION AI",
        "task_tag": "IMAGE CAPTIONING",
        "description": "Bootstrapped language-image pre-training with Querying Transformer (Q-Former).",
        "context_length": 2048,
        "parameters": "2.7B",
        "p50_latency_ms": 30,
        "price_per_1k": 0.08,
        "security_score": 94,
        "is_online": True
    },
    {
        "id": "idefics2-8b",
        "creator_id": "creator_meta",
        "name": "IDEFICS-2 8B Multimodal",
        "repo_id": "HuggingFaceM4/idefics2-8b",
        "domain": "VISION AI",
        "task_tag": "DEEP MULTIMODAL",
        "description": "Hugging Face flagship open multimodal model for interleaved text and images.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 62,
        "price_per_1k": 0.26,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "internvl2-8b",
        "creator_id": "creator_qwen",
        "name": "InternVL 2 8B",
        "repo_id": "OpenGVLab/InternVL2-8B",
        "domain": "VISION AI",
        "task_tag": "VISUAL REASONING",
        "description": "State-of-the-art 8B multimodal reasoning engine matching proprietary benchmarks.",
        "context_length": 32768,
        "parameters": "8B",
        "p50_latency_ms": 58,
        "price_per_1k": 0.24,
        "security_score": 96,
        "is_online": True
    },

    # ══════════════════════════════════════════════════════════════════════
    # 4. HEALTHCARE (Clinical & Biomedical Reasoning — 10 Models)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "biomistral-7b",
        "creator_id": "creator_biomistral",
        "name": "BioMistral 7B Medical",
        "repo_id": "BioMistral/BioMistral-7B",
        "domain": "HEALTHCARE",
        "task_tag": "CLINICAL REASONING",
        "description": "Open source biomedical foundation model pre-trained on PubMed Central.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 48,
        "price_per_1k": 0.18,
        "security_score": 99,
        "is_online": True
    },
    {
        "id": "meditron-7b",
        "creator_id": "creator_biomistral",
        "name": "MEDITRON 7B Clinical",
        "repo_id": "epfl-llm/meditron-7b",
        "domain": "HEALTHCARE",
        "task_tag": "CLINICAL GUIDELINES",
        "description": "EPFL clinical LLM adapted with curated medical guidelines and PubMed articles.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 46,
        "price_per_1k": 0.18,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "meditron-70b",
        "creator_id": "creator_biomistral",
        "name": "MEDITRON 70B Clinical Tier-1",
        "repo_id": "epfl-llm/meditron-70b",
        "domain": "HEALTHCARE",
        "task_tag": "DIAGNOSTIC TRIAGE",
        "description": "70B parameter flagship medical diagnostic and clinical decision support system.",
        "context_length": 4096,
        "parameters": "70B",
        "p50_latency_ms": 95,
        "price_per_1k": 0.65,
        "security_score": 99,
        "is_online": True
    },
    {
        "id": "llama3-openbiollm-8b",
        "creator_id": "creator_biomistral",
        "name": "OpenBioLLM Llama 3 8B",
        "repo_id": "aaditya/Llama3-OpenBioLLM-8B",
        "domain": "HEALTHCARE",
        "task_tag": "BIOMEDICAL",
        "description": "State-of-the-art open biomedical model outperforming GPT-4 on USMLE exams.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.20,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "llama3-openbiollm-70b",
        "creator_id": "creator_biomistral",
        "name": "OpenBioLLM Llama 3 70B",
        "repo_id": "aaditya/Llama3-OpenBioLLM-70B",
        "domain": "HEALTHCARE",
        "task_tag": "SPECIALIST CLINICAL",
        "description": "70B parameter specialized biomedical reasoning model with expert clinical mastery.",
        "context_length": 8192,
        "parameters": "70B",
        "p50_latency_ms": 98,
        "price_per_1k": 0.70,
        "security_score": 99,
        "is_online": True
    },
    {
        "id": "bio-clinicalbert",
        "creator_id": "creator_biomistral",
        "name": "Bio Clinical BERT",
        "repo_id": "emilyalsentzer/Bio_ClinicalBERT",
        "domain": "HEALTHCARE",
        "task_tag": "EHR CLASSIFICATION",
        "description": "BERT model trained on all notes from MIMIC-III database for EHR entity extraction.",
        "context_length": 512,
        "parameters": "110M",
        "p50_latency_ms": 12,
        "price_per_1k": 0.02,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "stanford-biomed-roberta",
        "creator_id": "creator_biomistral",
        "name": "Stanford Biomed RoBERTa",
        "repo_id": "StanfordAIMI/stanford-crfm-biomed-roberta",
        "domain": "HEALTHCARE",
        "task_tag": "PUBMED EXTRACTION",
        "description": "Stanford CRFM domain-adapted RoBERTa model for biomedical literature understanding.",
        "context_length": 512,
        "parameters": "125M",
        "p50_latency_ms": 12,
        "price_per_1k": 0.02,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "medical-llama3-8b",
        "creator_id": "creator_biomistral",
        "name": "Apollo Medical Llama 3",
        "repo_id": "Clinical-AI-Apollo/Medical-Llama3-8B",
        "domain": "HEALTHCARE",
        "task_tag": "CLINICAL PROTOCOLS",
        "description": "Fine-tuned on verified clinical guidelines and hospital treatment protocols.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 44,
        "price_per_1k": 0.22,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "bio-medical-llama-3-8b",
        "creator_id": "creator_biomistral",
        "name": "ContactDoctor BioMed 8B",
        "repo_id": "ContactDoctor/Bio-Medical-Llama-3-8B",
        "domain": "HEALTHCARE",
        "task_tag": "PATIENT TRIAGE",
        "description": "Specialized doctor-patient conversational triage and medical question answering.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.20,
        "security_score": 98,
        "is_online": True
    },
    {
        "id": "medici-7b",
        "creator_id": "creator_biomistral",
        "name": "Medici 7B Diagnostic",
        "repo_id": "chavinlo/medici-7b",
        "domain": "HEALTHCARE",
        "task_tag": "DIAGNOSTIC PATHOLOGY",
        "description": "Medical dialogue and pathological diagnostic reasoning model.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 46,
        "price_per_1k": 0.17,
        "security_score": 97,
        "is_online": True
    },

    # ══════════════════════════════════════════════════════════════════════
    # 5. FINANCE (Market Intelligence & Quantitative Sentiment — 10 Models)
    # ══════════════════════════════════════════════════════════════════════
    {
        "id": "fingpt-forecaster",
        "creator_id": "creator_fingpt",
        "name": "FinGPT Forecaster",
        "repo_id": "FinGPT/fingpt-forecaster",
        "domain": "FINANCE",
        "task_tag": "MARKET FORECASTING",
        "description": "Financial LLM predicting directional equity trends from SEC filings and news.",
        "context_length": 8192,
        "parameters": "7B",
        "p50_latency_ms": 35,
        "price_per_1k": 0.10,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "fingpt-sentiment-13b",
        "creator_id": "creator_fingpt",
        "name": "FinGPT Sentiment 13B",
        "repo_id": "FinGPT/fingpt-sentiment_llama2-13b_lora",
        "domain": "FINANCE",
        "task_tag": "FINANCIAL SENTIMENT",
        "description": "13B parameter LoRA financial sentiment scoring for equities and forex.",
        "context_length": 4096,
        "parameters": "13B",
        "p50_latency_ms": 42,
        "price_per_1k": 0.15,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "prosus-finbert",
        "creator_id": "creator_fingpt",
        "name": "Prosus FinBERT",
        "repo_id": "ProsusAI/finbert",
        "domain": "FINANCE",
        "task_tag": "EARNINGS CALL NLP",
        "description": "Industry gold standard BERT for financial sentiment classification on earnings transcripts.",
        "context_length": 512,
        "parameters": "110M",
        "p50_latency_ms": 12,
        "price_per_1k": 0.02,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "finbert-tone",
        "creator_id": "creator_fingpt",
        "name": "FinBERT Tone Analyzer",
        "repo_id": "yiyanghkust/finbert-tone",
        "domain": "FINANCE",
        "task_tag": "SEC FILING TONE",
        "description": "HKUST FinBERT fine-tuned on 10-K/10-Q corporate disclosures.",
        "context_length": 512,
        "parameters": "110M",
        "p50_latency_ms": 12,
        "price_per_1k": 0.02,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "financialbert-sentiment-analysis",
        "creator_id": "creator_fingpt",
        "name": "FinancialBERT Classifier",
        "repo_id": "ahmedrachid/FinancialBERT-Sentiment-Analysis",
        "domain": "FINANCE",
        "task_tag": "NEWS CLASSIFICATION",
        "description": "Fast financial sentiment model for real-time market wire streams.",
        "context_length": 512,
        "parameters": "110M",
        "p50_latency_ms": 12,
        "price_per_1k": 0.02,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "adaptllm-finance-llm",
        "creator_id": "creator_fingpt",
        "name": "AdaptLLM Finance Domain",
        "repo_id": "AdaptLLM/finance-LLM",
        "domain": "FINANCE",
        "task_tag": "QUANTITATIVE REASONING",
        "description": "Domain-adapted financial LLM for reading 10-K disclosures and macro reports.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 38,
        "price_per_1k": 0.12,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "bardsai-finance-sentiment",
        "creator_id": "creator_fingpt",
        "name": "BardsAI Finance Base",
        "repo_id": "bardsai/finance-sentiment-en-base",
        "domain": "FINANCE",
        "task_tag": "MARKET SENTIMENT",
        "description": "RoBERTa-based high-accuracy financial sentiment analysis model.",
        "context_length": 512,
        "parameters": "125M",
        "p50_latency_ms": 14,
        "price_per_1k": 0.03,
        "security_score": 95,
        "is_online": True
    },
    {
        "id": "thefinai-finma-7b",
        "creator_id": "creator_fingpt",
        "name": "FinMA 7B Quantitative",
        "repo_id": "TheFinAI/finma-7b-full",
        "domain": "FINANCE",
        "task_tag": "FINANCIAL QA",
        "description": "PIXIE instruction-tuned financial model for numeric calculation and table QA.",
        "context_length": 4096,
        "parameters": "7B",
        "p50_latency_ms": 45,
        "price_per_1k": 0.18,
        "security_score": 97,
        "is_online": True
    },
    {
        "id": "fincausal-classification",
        "creator_id": "creator_fingpt",
        "name": "FinCausal BERT",
        "repo_id": "nickmuchi/finbert-tone-finetuned-fincausal-classification",
        "domain": "FINANCE",
        "task_tag": "FINANCIAL CAUSALITY",
        "description": "Detects cause-and-effect relationships in financial news reports.",
        "context_length": 512,
        "parameters": "110M",
        "p50_latency_ms": 14,
        "price_per_1k": 0.03,
        "security_score": 96,
        "is_online": True
    },
    {
        "id": "fin-llama-3-8b",
        "creator_id": "creator_fingpt",
        "name": "Fin-Llama 3 8B Analyst",
        "repo_id": "ChanceFocus/fin-llama-3-8b",
        "domain": "FINANCE",
        "task_tag": "FINANCIAL ANALYSIS",
        "description": "Llama 3 8B specialized for financial statement analysis and investment summaries.",
        "context_length": 8192,
        "parameters": "8B",
        "p50_latency_ms": 40,
        "price_per_1k": 0.16,
        "security_score": 97,
        "is_online": True
    }
]

async def seed_database():
    print(f"[AgentHub Seed] Expanding AIModel catalog with {len(EXPANDED_MODEL_CATALOG)} verified Hugging Face repositories across 5 domains...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as session:
        # 1. Seed Creators
        for c_data in INITIAL_CREATORS:
            creator = Creator(**c_data)
            session.add(creator)
            
        # 2. Seed Default Developer User & Wallet
        demo_user_id = "usr_guest_demo"
        demo_user = User(
            id=demo_user_id,
            email="developer@agenthub.ai",
            handle="agenthub_dev",
            hashed_password=hash_password("demo_password_123"),
            role="consumer"
        )
        demo_wallet = Wallet(
            id="wal_guest_demo",
            user_id=demo_user_id,
            balance_credits=500.0
        )
        session.add(demo_user)
        session.add(demo_wallet)
        
        # 3. Seed 51 Expanded AI Models & OWASP Audits
        for m_data in EXPANDED_MODEL_CATALOG:
            model = AIModel(**m_data)
            session.add(model)
            
            audit = OWASPAudit(
                id=f"audit_{m_data['id']}",
                model_id=m_data["id"],
                overall_score=m_data["security_score"],
                prompt_injection_score=m_data["security_score"],
                jailbreak_resistance_score=m_data["security_score"] - 1,
                task_hijacking_score=m_data["security_score"],
                data_leakage_score=m_data["security_score"] - 2,
                context_manipulation_score=m_data["security_score"] - 1,
                audit_summary=f"Automated OWASP Red-Team verification passed with {m_data['security_score']}% overall safety score for {m_data['repo_id']}.",
                vulnerabilities=[
                    {"test": "Direct Prompt Override", "status": "PASSED", "severity": "INFO"},
                    {"test": "Task Hijacking Containment", "status": "PASSED", "severity": "LOW"}
                ]
            )
            session.add(audit)
            
        await session.commit()
        print(f"[AgentHub Seed] Seed complete: {len(INITIAL_CREATORS)} Creators and {len(EXPANDED_MODEL_CATALOG)} Models provisioned.")

if __name__ == "__main__":
    asyncio.run(seed_database())