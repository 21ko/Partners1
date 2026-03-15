import os
import psycopg2
from psycopg2.extras import RealDictCursor

CONN_STRING = "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres"

def init_db():
    print(f"Connecting to {CONN_STRING.split('@')[-1]}...")
    try:
        conn = psycopg2.connect(CONN_STRING)
        cur = conn.cursor()
        print("Connected.")

        # 1. Builders Table
        print("Checking builders table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS builders (
                username TEXT PRIMARY KEY,
                password TEXT,
                github_username TEXT,
                avatar TEXT,
                bio TEXT,
                building_style TEXT,
                interests TEXT[],
                open_to TEXT[],
                availability TEXT,
                current_idea TEXT,
                city TEXT,
                github_languages TEXT[],
                github_repos JSONB,
                total_stars INTEGER DEFAULT 0,
                public_repos INTEGER DEFAULT 0,
                learning TEXT[],
                experience_level TEXT DEFAULT 'intermediate',
                looking_for TEXT DEFAULT 'build_partner',
                email TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Sessions Table
        print("Checking sessions table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                username TEXT REFERENCES builders(username),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 3. Communities Table
        print("Checking communities table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS communities (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name TEXT NOT NULL,
                description TEXT,
                host_username TEXT REFERENCES builders(username),
                type TEXT DEFAULT 'general',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Community Members Table
        print("Checking community_members table...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS community_members (
                community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
                username TEXT REFERENCES builders(username) ON DELETE CASCADE,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (community_id, username)
            );
        """)

        conn.commit()
        print("All tables checked/created.")
        
        # Check current builder count
        cur.execute("SELECT count(*) FROM builders")
        count = cur.fetchone()[0]
        print(f"Current builders in DB: {count}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Initialization Error: {e}")

if __name__ == "__main__":
    init_db()
