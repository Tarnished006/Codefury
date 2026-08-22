"""
Comprehensive Database Schema Migration Script
Ensures all tables and columns match SQLAlchemy models exactly.
"""

import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "agenthub.db"

def run_migration():
    if not db_path.exists():
        print(f"Database {db_path} does not exist yet.")
        return

    conn = sqlite3.connect(str(db_path))
    c = conn.cursor()

    # 1. creators table
    c.execute("PRAGMA table_info(creators)")
    cols = [row[1] for row in c.fetchall()]
    if "user_id" not in cols:
        print("Adding user_id to creators...")
        c.execute("ALTER TABLE creators ADD COLUMN user_id VARCHAR(36)")

    # 2. ai_models table
    c.execute("PRAGMA table_info(ai_models)")
    cols = [row[1] for row in c.fetchall()]
    if "purchase_price" not in cols:
        print("Adding purchase_price to ai_models...")
        c.execute("ALTER TABLE ai_models ADD COLUMN purchase_price FLOAT DEFAULT 100.0")

    # 3. registered_endpoints table
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='registered_endpoints'")
    if not c.fetchone():
        print("Creating registered_endpoints table...")
        c.execute("""
            CREATE TABLE registered_endpoints (
                id VARCHAR(36) PRIMARY KEY,
                developer_id VARCHAR(36) NOT NULL,
                model_name VARCHAR(255) NOT NULL,
                domain VARCHAR(64) DEFAULT 'LLM CHAT',
                task_tag VARCHAR(100) DEFAULT 'Generative AI',
                api_endpoint VARCHAR(512) NOT NULL,
                api_key_env_or_secret VARCHAR(512),
                price_per_1k_tokens FLOAT DEFAULT 0.10,
                p50_latency_ms INTEGER DEFAULT 45,
                context_length INTEGER DEFAULT 8192,
                is_active BOOLEAN DEFAULT 1,
                total_requests INTEGER DEFAULT 0,
                total_tokens_metered INTEGER DEFAULT 0,
                created_at DATETIME
            )
        """)

    # 4. purchased_models table
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='purchased_models'")
    if not c.fetchone():
        print("Creating purchased_models table...")
        c.execute("""
            CREATE TABLE purchased_models (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                model_id VARCHAR(64) NOT NULL,
                price_paid FLOAT DEFAULT 0.0,
                purchased_at DATETIME
            )
        """)

    # 5. tested_models table
    c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tested_models'")
    if not c.fetchone():
        print("Creating tested_models table...")
        c.execute("""
            CREATE TABLE tested_models (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                model_id VARCHAR(64) NOT NULL,
                tested_at DATETIME,
                test_details VARCHAR(255)
            )
        """)

    # 6. ledger_transactions table
    c.execute("PRAGMA table_info(ledger_transactions)")
    cols = [row[1] for row in c.fetchall()]
    if "creator_id" not in cols:
        print("Adding creator_id to ledger_transactions...")
        c.execute("ALTER TABLE ledger_transactions ADD COLUMN creator_id VARCHAR(64)")

    conn.commit()
    conn.close()
    print("Comprehensive database migration finished successfully!")

if __name__ == "__main__":
    run_migration()
