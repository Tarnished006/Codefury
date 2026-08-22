import sys
import subprocess
from pathlib import Path

# Auto-detect and switch to local virtual environment (.venv) if run with global Python
_BACKEND_DIR = Path(__file__).resolve().parent
_VENV_PYTHON = _BACKEND_DIR / ".venv" / "Scripts" / "python.exe"
if not _VENV_PYTHON.exists():
    _VENV_PYTHON = _BACKEND_DIR / ".venv" / "bin" / "python"

if _VENV_PYTHON.exists() and Path(sys.executable).resolve() != _VENV_PYTHON.resolve():
    print(f"[AgentHub] Auto-switching from system Python ({sys.executable}) -> Virtualenv ({_VENV_PYTHON})")
    result = subprocess.run([str(_VENV_PYTHON), __file__] + sys.argv[1:])
    sys.exit(result.returncode)

import uvicorn

if __name__ == "__main__":
    print("[AgentHub API] Launching FastAPI backend on http://0.0.0.0:8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)