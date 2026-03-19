import os
import sys

# Ensure backend module can be imported
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from database import get_db_conn

sql = """
CREATE TABLE IF NOT EXISTS follows (
    follower_username VARCHAR(255) REFERENCES builders(username) ON DELETE CASCADE,
    following_username VARCHAR(255) REFERENCES builders(username) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_username, following_username)
);
"""

def run_migration():
    print("Connecting to DB...")
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute(sql)
    conn.commit()
    print("Migration successful! `follows` table created.")
    cur.close()
    conn.close()

if __name__ == '__main__':
    run_migration()
