import sqlite3
from pathlib import Path

db_path = Path("agenthub.db")

def migrate():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Check columns in users table
    cursor.execute("PRAGMA table_info(users)")
    cols = [row[1] for row in cursor.fetchall()]
    
    if "oauth_provider" not in cols:
        print("[Migration] Adding oauth_provider to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(32)")
        
    if "oauth_id" not in cols:
        print("[Migration] Adding oauth_id to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255)")
        
    if "avatar_url" not in cols:
        print("[Migration] Adding avatar_url to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)")
        
    conn.commit()
    conn.close()
    print("[Migration] SQLite migration complete!")

if __name__ == "__main__":
    migrate()
