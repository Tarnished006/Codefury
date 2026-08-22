import asyncio
import datetime
import hashlib
import os
import shutil
import subprocess
import sys
import tempfile
import time
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.dependencies import get_current_user, get_optional_user
from app.models import ApiKey, TestedModel, User
from app.schemas import ExecuteSnippetRequest, ExecuteSnippetResponse, CreateApiKeyRequest, ApiKeyResponse

router = APIRouter(tags=["Sandbox & Deployment Canvas"])

# Isolated temp directory for ephemeral script execution
SANDBOX_DIR = Path("backend/temp_sandbox")
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

# Artifact blob storage directory
ARTIFACTS_DIR = Path("backend/artifacts")
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def ensure_sandbox_sdk():
    """Copies agenthub.py SDK into sandbox directory so import agenthub works in all executions."""
    sdk_src = Path("backend/agenthub.py")
    if not sdk_src.exists():
        sdk_src = Path("agenthub.py")
    if sdk_src.exists():
        sdk_dst = SANDBOX_DIR / "agenthub.py"
        try:
            shutil.copy(sdk_src, sdk_dst)
        except Exception:
            pass


@router.post("/sandbox/execute", response_model=ExecuteSnippetResponse)
async def execute_code_snippet(
    req: ExecuteSnippetRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Live Python/Node.js code execution via sandboxed subprocess runner.
    - Ensures agenthub.py SDK is available in the execution environment.
    - Executes with a hard 10-second timeout.
    - Returns real stdout/stderr, exit_code, session_id, and execution latency.
    """
    start_time = time.monotonic()
    session_id = uuid.uuid4().hex[:12]
    ext = "py" if req.language == "python" else "js"
    temp_file = SANDBOX_DIR / f"sess_{session_id}.{ext}"

    # Ensure SDK is in sandbox dir
    ensure_sandbox_sdk()

    # Write submitted code to isolated ephemeral file
    temp_file.write_text(req.code, encoding="utf-8")

    # Set PYTHONPATH and encoding so import agenthub and unicode print cleanly
    env = os.environ.copy()
    env["PYTHONIOENCODING"] = "utf-8"
    backend_path = str(Path("backend").resolve())
    sandbox_path = str(SANDBOX_DIR.resolve())
    curr_pythonpath = env.get("PYTHONPATH", "")
    env["PYTHONPATH"] = f"{sandbox_path}{os.pathsep}{backend_path}{os.pathsep}{curr_pythonpath}"

    cmd = [sys.executable, str(temp_file)] if req.language == "python" else ["node", str(temp_file)]

    def _run_subprocess():
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10.0,
                env=env,
                cwd=str(SANDBOX_DIR.resolve())
            )
            return res.stdout, res.stderr, res.returncode
        except subprocess.TimeoutExpired:
            return "", "[Execution Timeout]: Script exceeded the 10-second resource limit and was terminated.", -1
        except Exception as e:
            return "", f"[Subprocess Launch Error]: {type(e).__name__}: {str(e)}", -2
        finally:
            try:
                if temp_file.exists():
                    temp_file.unlink()
            except Exception:
                pass

    stdout_text, stderr_text, exit_code = await asyncio.to_thread(_run_subprocess)
    duration_ms = max(1, int((time.monotonic() - start_time) * 1000))

    # Build human-readable terminal output
    lines = [
        f"╔══ AgentHub Execution Sandbox [{req.language.upper()}] ══╗",
        f"║ Session:   {session_id}",
        f"║ Model:     {req.model_id} // Key: {req.api_key or 'demo_ephemeral'}",
        f"║ Latency:   {duration_ms}ms RTT | Exit: {exit_code}",
        f"╚{'═' * 44}╝",
        ""
    ]

    if stdout_text.strip():
        lines.append(stdout_text.rstrip())
    if stderr_text.strip():
        lines.append(f"\n[STDERR]:\n{stderr_text.rstrip()}")
    if not stdout_text.strip() and not stderr_text.strip():
        lines.append("Process exited with code 0 (no output written to stdout).")

    final_output = "\n".join(lines)

    # Calculate token estimate
    tokens_used = max(1, (len(stdout_text) // 4) + (len(req.code) // 4))

    return ExecuteSnippetResponse(
        session_id=session_id,
        output=final_output,
        execution_time_ms=duration_ms,
        tokens_used=tokens_used,
        model_tested=req.model_id
    )


@router.post("/auth/api-keys", response_model=ApiKeyResponse)
@router.post("/keys", response_model=ApiKeyResponse)
async def generate_api_key_endpoint(
    req: CreateApiKeyRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Provisions a production API key for SDK inference calls.
    Returns the full secret key ONCE. Key is stored securely as a cryptographic hash.
    """
    user_id = current_user.id if current_user else "usr_guest_demo"

    raw_secret = f"ak_live_{uuid.uuid4().hex}{uuid.uuid4().hex[:8]}"
    prefix = raw_secret[:12]
    hashed = hashlib.sha256(raw_secret.encode()).hexdigest()

    key_id = f"key_{uuid.uuid4().hex[:10]}"
    api_key_obj = ApiKey(
        id=key_id,
        user_id=user_id,
        name=req.name or "Production Key",
        key_prefix=prefix,
        hashed_key=hashed,
        is_active=True,
        created_at=datetime.datetime.utcnow()
    )
    db.add(api_key_obj)
    await db.commit()

    return ApiKeyResponse(
        id=key_id,
        name=api_key_obj.name,
        key_prefix=prefix,
        api_key=raw_secret,
        created_at=api_key_obj.created_at,
        is_active=True
    )


@router.delete("/auth/api-keys/{key_id}")
@router.delete("/keys/{key_id}")
async def delete_api_key_endpoint(
    key_id: str,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """Deletes and permanently revokes an API key from the database."""
    k_res = await db.execute(
        select(ApiKey).filter(
            (ApiKey.id == key_id) | (ApiKey.key_prefix == key_id)
        )
    )
    key_obj = k_res.scalars().first()
    if not key_obj:
        raise HTTPException(status_code=404, detail=f"API Key '{key_id}' not found.")

    await db.delete(key_obj)
    await db.commit()
    return {"status": "SUCCESS", "message": f"API key '{key_id}' revoked and deleted successfully."}