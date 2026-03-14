import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

# We'll use the connection string for maximum reliability and to bypass RLS issues
DB_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres")

def get_db_conn():
    conn = psycopg2.connect(DB_URL, cursor_factory=RealDictCursor)
    return conn

# Helper for builders
def get_builders():
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM builders")
            return cur.fetchall()

def get_builder_by_username(username: str):
    with get_db_conn() as conn:
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
    
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(query, values)
        conn.commit()

# Helper for sessions
def save_session(session_id: str, username: str):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO sessions (session_id, username)
                VALUES (%s, %s)
                ON CONFLICT (session_id) DO NOTHING
            """, (session_id, username))
        conn.commit()

def get_session_username(session_id: str):
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT username FROM sessions WHERE session_id = %s", (session_id,))
            res = cur.fetchone()
            return res['username'] if res else None

def delete_expired_sessions(days=30):
    from datetime import datetime, timedelta
    cutoff = datetime.now() - timedelta(days=days)
    with get_db_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sessions WHERE created_at < %s", (cutoff,))
        conn.commit()
