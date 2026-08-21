const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchModels(domain?: string) {
  const url = domain && domain !== "ALL_DOMAINS" 
    ? `${API_BASE_URL}/models?domain=${encodeURIComponent(domain)}`
    : `${API_BASE_URL}/models`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function fetchModelAudit(modelId: string) {
  const res = await fetch(`${API_BASE_URL}/audit/${modelId}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit report");
  return res.json();
}

export async function orchestrateDAG(goal: string, userId?: string, maxBudgetCredits?: number) {
  const res = await fetch(`${API_BASE_URL}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      goal,
      user_id: userId,
      max_budget_credits: maxBudgetCredits
    })
  });
  if (!res.ok) throw new Error("Failed to orchestrate task");
  return res.json();
}

export async function fetchCreators() {
  const res = await fetch(`${API_BASE_URL}/creators`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch creators");
  return res.json();
}

export async function fetchCreatorEarnings(creatorId: string) {
  const res = await fetch(`${API_BASE_URL}/creators/${creatorId}/earnings`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch creator earnings");
  return res.json();
}

export async function requestCreatorPayout(payload: {
  creator_id: string;
  amount_credits: number;
  payout_method: string;
  destination_address: string;
}) {
  const res = await fetch(`${API_BASE_URL}/creators/payout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Payout failed");
  }
  return res.json();
}

export async function executeSandboxSnippet(language: string, code: string, modelId: string, apiKey?: string) {
  const res = await fetch(`${API_BASE_URL}/sandbox/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language, code, model_id: modelId, api_key: apiKey })
  });
  if (!res.ok) throw new Error("Sandbox execution failed");
  return res.json();
}

export async function generateApiKey(name: string = "Production Key") {
  const res = await fetch(`${API_BASE_URL}/keys`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  if (!res.ok) throw new Error("API key generation failed");
  return res.json();
}

export async function checkoutWallet(userId: string, creditsPackage: number, cardLast4: string = "4242") {
  const res = await fetch(`${API_BASE_URL}/wallet/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, credits_package: creditsPackage, card_last4: cardLast4 })
  });
  if (!res.ok) throw new Error("Checkout failed");
  return res.json();
}