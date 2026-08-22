"""
AgentHub SQLite Database CLI Visualizer
Run with: python backend/inspect_db.py
"""

import sqlite3
from pathlib import Path

# Resolve path to agenthub.db
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = _PROJECT_ROOT / "agenthub.db"

def visualize_database():
    if not DB_PATH.exists():
        print(f"Error: Database file not found at: {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Retrieve all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print("=" * 65)
    print(f"  AGENTS HUB DATABASE VISUALIZER ({DB_PATH.name})")
    print("=" * 65)
    print(f" Total Tables: {len(tables)}\n")

    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        
        cursor.execute(f"PRAGMA table_info({table})")
        cols = [c[1] for c in cursor.fetchall()]
        
        print(f" [TABLE] {table.upper()} ({count} records)")
        print(f" Columns: {', '.join(cols)}")
        
        cursor.execute(f"SELECT * FROM {table} LIMIT 3")
        rows = cursor.fetchall()
        if rows:
            print(" Sample Rows:")
            for i, r in enumerate(rows, start=1):
                # Truncate long strings for clean display
                formatted_row = tuple(str(val)[:30] + "..." if isinstance(val, str) and len(val) > 30 else val for val in r)
                print(f"   {i}. {formatted_row}")
        else:
            print("   (Table is currently empty)")
        print("-" * 65)

    conn.close()

if __name__ == "__main__":
    visualize_database()
