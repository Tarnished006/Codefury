import httpx
import json

BASE_URL = "http://localhost:8000"

def test_all_endpoints():
    print("==================================================")
    print("         AgentHub Backend Full E2E Audit          ")
    print("==================================================")
    
    with httpx.Client(timeout=10.0) as client:
        # 1. Health
        r = client.get(f"{BASE_URL}/health")
        assert r.status_code == 200, f"Health failed: {r.status_code}"
        print("[PASS] 1. /health -> 200 OK:", r.json())
        
        # 2. Guest Demo Auth
        r = client.post(f"{BASE_URL}/api/auth/guest-demo")
        assert r.status_code == 200, f"Guest auth failed: {r.status_code}"
        auth_data = r.json()
        token = auth_data["access_token"]
        user_id = auth_data["user"]["id"]
        print(f"[PASS] 2. /api/auth/guest-demo -> 200 OK (User: {user_id}, Credits: {auth_data['user']['credits']})")
        
        # 3. Model Catalog
        r = client.get(f"{BASE_URL}/api/models")
        assert r.status_code == 200, f"Models failed: {r.status_code}"
        models = r.json()
        assert len(models) >= 6, "Expected at least 6 models"
        print(f"[PASS] 3. /api/models -> 200 OK ({len(models)} models loaded)")
        
        # 4. Meta-Agent DAG Orchestrator
        payload = {"goal": "Analyze quarterly budget variance anomalies and compile python script"}
        r = client.post(f"{BASE_URL}/api/orchestrate", json=payload)
        assert r.status_code == 200, f"Orchestrate failed: {r.status_code}"
        dag = r.json()
        print(f"[PASS] 4. /api/orchestrate -> 200 OK (DAG steps: {len(dag['dag_plan'])}, Time: {dag['execution_time_ms']}ms)")
        
        # 5. OWASP Security Audit
        r = client.get(f"{BASE_URL}/api/audit/llama3")
        assert r.status_code == 200, f"Audit failed: {r.status_code}"
        audit = r.json()
        print(f"[PASS] 5. /api/audit/llama3 -> 200 OK (Overall: {audit['overall_score']}%, Prompt Inj: {audit['prompt_injection_score']}%)")
        
        # 6. Sandbox Execution
        payload = {"language": "python", "code": "print('live test')", "model_id": "llama3"}
        r = client.post(f"{BASE_URL}/api/sandbox/execute", json=payload)
        assert r.status_code == 200, f"Sandbox failed: {r.status_code}"
        sandbox = r.json()
        print(f"[PASS] 6. /api/sandbox/execute -> 200 OK (Status: {sandbox['status']}, Time: {sandbox['execution_time_ms']}ms)")
        
        # 7. Wallet Top-up
        r = client.post(f"{BASE_URL}/api/wallet/topup/{user_id}", json={"amount_credits": 100.0})
        assert r.status_code == 200, f"Wallet topup failed: {r.status_code}"
        wallet = r.json()
        print(f"[PASS] 7. /api/wallet/topup -> 200 OK (New Balance: {wallet['balance_credits']} Credits)")
        
        # 8. API Key Generation
        r = client.post(f"{BASE_URL}/api/keys", json={"name": "E2E Test Key"})
        assert r.status_code == 200, f"Key generation failed: {r.status_code}"
        key = r.json()
        print(f"[PASS] 8. /api/keys -> 200 OK (Key: {key['api_key'][:16]}...)")
        
        print("==================================================")
        print("      ALL 8 ENDPOINTS VERIFIED 100% OPERATIONAL   ")
        print("==================================================")

if __name__ == "__main__":
    test_all_endpoints()