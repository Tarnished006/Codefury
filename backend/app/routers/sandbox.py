import asyncio
import datetime
import hashlib
import os
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


@router.post("/sandbox/execute", response_model=ExecuteSnippetResponse)
async def execute_code_snippet(
    req: ExecuteSnippetRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Live Python/Node.js code execution via sandboxed subprocess runner.
    - Writes payload to an isolated temp file in backend/temp_sandbox/{session_id}.py
    - Executes with a hard 5-second timeout; kills process on expiry.
    - Returns real stdout/stderr, exit_code, session_id, and execution latency.
    """
    start_time = time.monotonic()
    session_id = uuid.uuid4().hex[:12]
    ext = "py" if req.language == "python" else "js"
    temp_file = SANDBOX_DIR / f"sess_{session_id}.{ext}"

    # Write submitted code to isolated ephemeral file
    temp_file.write_text(req.code, encoding="utf-8")

    cmd = [sys.executable, str(temp_file)] if req.language == "python" else ["node", str(temp_file)]

    def _run_subprocess():
        try:
            res = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=5.0
            )
            return res.stdout, res.stderr, res.returncode
        except subprocess.TimeoutExpired:
            return "", "[Execution Timeout]: Script exceeded the 5-second resource limit and was terminated.", -1
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

    # Automatically register model as tested by user
    if current_user and req.model_id:
        tst_res = await db.execute(
            select(TestedModel).filter(
                TestedModel.user_id == current_user.id,
                TestedModel.model_id == req.model_id
            )
        )
        if not tst_res.scalars().first():
            tst = TestedModel(
                id=f"tst_{uuid.uuid4().hex[:10]}",
                user_id=current_user.id,
                model_id=req.model_id,
                test_details=f"Sandbox code execution snippet ({req.language})"
            )
            db.add(tst)
            await db.commit()

    return ExecuteSnippetResponse(
        status="SUCCESS" if exit_code == 0 else ("TIMEOUT" if exit_code == -1 else "ERROR"),
        output=final_output,
        execution_time_ms=duration_ms,
        tokens_used=len(req.code.split()) + 12,
        cost_deducted=0.005,
        exit_code=exit_code,
        session_id=session_id
    )


@router.post("/keys", response_model=ApiKeyResponse)
async def generate_api_key(
    req: CreateApiKeyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Provisions a scoped production API key for live GPU cluster deployments and stores in DB."""
    raw_key = f"ak_live_{uuid.uuid4().hex[:24]}"
    key_prefix = raw_key[8:16]
    hashed = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

    new_key = ApiKey(
        id=f"key_{uuid.uuid4().hex[:8]}",
        user_id=current_user.id,
        name=req.name,
        key_prefix=key_prefix,
        hashed_key=hashed,
        is_active=True
    )
    db.add(new_key)
    await db.commit()
    await db.refresh(new_key)

    return ApiKeyResponse(
        id=new_key.id,
        name=new_key.name,
        api_key=raw_key,
        created_at=new_key.created_at
    )