const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("agenthub_token") || localStorage.getItem("agentnet_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function fetchModels(domain?: string) {
  const url = domain && domain !== "ALL_DOMAINS" 
    ? `${API_BASE_URL}/models?domain=${encodeURIComponent(domain)}`
    : `${API_BASE_URL}/models`;
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch models");
  return res.json();
}

export async function fetchModelAudit(modelId: string) {
  const res = await fetch(`${API_BASE_URL}/audit/${modelId}`, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch audit report");
  return res.json();
}

export async function orchestrateDAG(goal: string, userId?: string, maxBudgetCredits?: number) {
  const res = await fetch(`${API_BASE_URL}/orchestrate`, {
    method: "POST",
    headers: getAuthHeaders(),
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
  const res = await fetch(`${API_BASE_URL}/creators`, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch creators");
  return res.json();
}

export async function fetchCreatorEarnings(creatorId: string) {
  const res = await fetch(`${API_BASE_URL}/creators/${creatorId}/earnings`, { headers: getAuthHeaders(), cache: "no-store" });
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Payout failed");
  }
  return res.json();
}

export async function generateApiKey(name: string = "Production Key") {
  const res = await fetch(`${API_BASE_URL}/auth/api-keys`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "API key generation failed" }));
    throw new Error(err.detail || "API key generation failed");
  }
  return res.json();
}

export async function deleteApiKey(keyId: string) {
  const res = await fetch(`${API_BASE_URL}/auth/api-keys/${keyId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to delete API key" }));
    throw new Error(err.detail || "Failed to delete API key");
  }
  return res.json();
}

export async function checkoutWallet(userId: string, creditsPackage: number, cardLast4: string = "4242") {
  const res = await fetch(`${API_BASE_URL}/wallet/checkout`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ user_id: userId, credits_package: creditsPackage, card_last4: cardLast4 })
  });
  if (!res.ok) throw new Error("Checkout failed");
  return res.json();
}

export async function fetchProfileDetails() {
  const res = await fetch(`${API_BASE_URL}/auth/profile-details`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Failed to fetch profile details");
  return res.json();
}

export async function updateProfile(payload: { handle?: string; email?: string; password?: string }) {
  const res = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Profile update failed");
  }
  return res.json();
}

export async function purchaseModel(modelId: string) {
  const res = await fetch(`${API_BASE_URL}/models/${modelId}/purchase`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Model purchase failed");
  }
  return res.json();
}

export async function testModel(modelId: string) {
  const res = await fetch(`${API_BASE_URL}/models/${modelId}/test`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Model test failed");
  }
  return res.json();
}

export async function createModel(payload: {
  name: string;
  repo_id: string;
  domain: string;
  task_tag: string;
  description?: string;
  context_length?: number;
  parameters?: string;
  price_per_1k?: number;
  purchase_price?: number;
}) {
  const res = await fetch(`${API_BASE_URL}/models`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to publish model");
  }
  return res.json();
}

export async function convertToCreator() {
  const res = await fetch(`${API_BASE_URL}/auth/convert-to-creator`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Conversion to Creator failed");
  }
  return res.json();
}

export async function deleteModel(modelId: string) {
  const res = await fetch(`${API_BASE_URL}/models/${modelId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete model");
  }
  return res.json();
}

export async function updateModel(modelId: string, payload: any) {
  const res = await fetch(`${API_BASE_URL}/models/${modelId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update model");
  }
  return res.json();
}

export async function fetchCreatorMe() {
  const res = await fetch(`${API_BASE_URL}/creators/me`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch creator profile");
  }
  return res.json();
}

export async function fetchCreatorTransactions() {
  const res = await fetch(`${API_BASE_URL}/creators/me/transactions`, {
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to fetch creator transactions");
  }
  return res.json();
}