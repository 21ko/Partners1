import os
import psycopg2
from psycopg2.extras import RealDictCursor, register_default_jsonb
from dotenv import load_dotenv
import bcrypt

def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password. Supports plain-text fallback for existing users."""
    if not hashed_password:
        return False
    
    # Check if it looks like a bcrypt hash (starts with $2b$ or $2a$)
    if hashed_password.startswith('$2b$') or hashed_password.startswith('$2a$'):
        try:
            return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
        except Exception:
            return False
    
    # Fallback to plain text comparison for legacy users
    return plain_password == hashed_password

load_dotenv()

# Ensure JSONB is handled correctly
register_default_jsonb()

# We'll use the connection string for maximum reliability and to bypass RLS issues
_RAW_URL = os.environ.get("DATABASE_URL")

if not _RAW_URL:
    # This should only happen in local dev if .env is missing
    print("[database] WARNING: DATABASE_URL not found in environment!")
    raise Exception("DATABASE_URL environment variable is required")

# Normalize: psycopg2 prefers 'postgresql://' over 'postgres://'
if _RAW_URL.startswith("postgres://"):
    DB_URL = _RAW_URL.replace("postgres://", "postgresql://", 1)
else:
    DB_URL = _RAW_URL

def get_db_conn():
    # Supabase/Postgres usually requires SSL
    conn_url = DB_URL
    if "sslmode" not in conn_url:
        separator = "&" if "?" in conn_url else "?"
        conn_url += f"{separator}sslmode=require"
    
    return psycopg2.connect(conn_url, cursor_factory=RealDictCursor)

import contextlib

@contextlib.contextmanager
def db_session():
    conn = get_db_conn()
    try:
        yield conn
    finally:
        conn.close()

# Helper for builders
def get_builders():
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM builders")
            return cur.fetchall()

def get_builder_by_username(username: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM builders WHERE username = %s", (username,))
            return cur.fetchone()

def upsert_builder(builder_data: dict):
    # Convert lists/dicts to JSON for postgres
    import json
    data = builder_data.copy()
    for key in ['interests', 'open_to', 'github_languages', 'learning']:
        if key in data and isinstance(data[key], list):
            # Postgres ARRAY type handles string lists fine if passed as list, 
            # but we need to ensure they are python lists.
            pass
    
    if 'github_repos' in data:
        data['github_repos'] = json.dumps(data['github_repos'])

    columns = list(data.keys())
    values = [data[col] for col in columns]
    
    placeholders = ", ".join(["%s"] * len(columns))
    update_clause = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns if col != 'username'])

    query = f"""
        INSERT INTO builders ({", ".join(columns)})
        VALUES ({placeholders})
        ON CONFLICT (username) DO UPDATE SET {update_clause}
    """
    
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute(query, values)
        conn.commit()

# Helper for sessions
def save_session(session_id: str, username: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sessions (session_id, username)
                VALUES (%s, %s)
                ON CONFLICT (session_id) DO NOTHING
            """, (session_id, username))
        conn.commit()

def get_session_username(session_id: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT username FROM sessions WHERE session_id = %s", (session_id,))
            res = cur.fetchone()
            return res['username'] if res else None

def delete_expired_sessions(days=30):
    from datetime import datetime, timedelta
    cutoff = datetime.now() - timedelta(days=days)
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE created_at < %s", (cutoff,))
        conn.commit()

# Helper for communities
def create_community(name: str, description: str, host_username: str = None, type: str = 'general'):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO communities (name, description, host_username, type)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (name, description, host_username, type))
            res = cur.fetchone()
            conn.commit()
            return res['id']

def get_communities():
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.*, (SELECT count(*) FROM community_members cm WHERE cm.community_id = c.id) as members_count
                FROM communities c
                ORDER BY c.created_at DESC
            """)
            return cur.fetchall()

def get_community_by_id(community_id: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.*, (SELECT count(*) FROM community_members cm WHERE cm.community_id = c.id) as members_count
                FROM communities c
                WHERE c.id = %s
            """, (community_id,))
            return cur.fetchone()

def join_community(community_id: str, username: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO community_members (community_id, username)
                VALUES (%s, %s)
                ON CONFLICT DO NOTHING
            """, (community_id, username))
        conn.commit()

def get_community_members(community_id: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT b.* FROM builders b
                JOIN community_members cm ON b.username = cm.username
                WHERE cm.community_id = %s
            """, (community_id,))
            return cur.fetchall()

def get_user_communities(username: str):
    with db_session() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT c.* FROM communities c
                JOIN community_members cm ON c.id = cm.community_id
                WHERE cm.username = %s
            """, (username,))
            return cur.fetchall()
