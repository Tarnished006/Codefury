"""
AgentHub MCP Server Entrypoint
==============================
Exposes AgentHub's AI marketplace and execution engine via the Model Context
Protocol (MCP) over stdio or SSE transport.

Usage:
  python backend/mcp_server.py                     # Defaults to stdio (Claude Desktop / Cursor)
  python backend/mcp_server.py --transport sse     # SSE remote transport (port 8001)
"""

import sys
from pathlib import Path

# Add backend/ to sys.path
_BACKEND_DIR = Path(__file__).resolve().parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from app.mcp_server import mcp

if __name__ == "__main__":
    if "--transport" in sys.argv and "sse" in sys.argv:
        mcp.run(transport="sse")
    elif "--sse" in sys.argv:
        mcp.run(transport="sse")
    else:
        # Default to stdio for Claude Desktop / Cursor
        mcp.run(transport="stdio")