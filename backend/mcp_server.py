"""
AgentHub MCP Server
===================
Exposes AgentHub's AI marketplace and execution engine via the Model Context
Protocol (MCP) over SSE (Server-Sent Events) or stdio transport.

Usage:
  python backend/mcp_server.py --transport sse --port 8001
  python backend/mcp_server.py --transport stdio
"""

import asyncio
import sys
import tempfile
import os
from pathlib import Path

# Add backend/ to sys.path
_BACKEND_DIR = Path(__file__).parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

try:
    from app.mcp_server import mcp, FastMCP
except ImportError:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("AgentHub Marketplace Remote Server", host="0.0.0.0", port=8001)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="AgentHub Remote MCP Server")
    parser.add_argument("--transport", choices=["stdio", "sse"], default="sse")
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()

    mcp.port = args.port
    print(f"[AgentHub MCP] Initializing server on port {args.port} via {args.transport}...")
    mcp.run(transport=args.transport)
