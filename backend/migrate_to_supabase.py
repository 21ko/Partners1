import json
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
import os

# Using the connection string provided by the user
CONN_STRING = "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres"
DATA_FILE = Path(__file__).parent / "builders.json"

def migrate():
    if not DATA_FILE.exists():
        print(f"[migrate] skipping: {DATA_FILE} not found")
        return

    print(f"[migrate] reading {DATA_FILE}...")
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    try:
        conn = psycopg2.connect(CONN_STRING)
        cur = conn.cursor()
        print("[migrate] connected to postgresql.")

        # 1. Migrate Builders
        builders = data.get("builders", [])
        print(f"[migrate] found {len(builders)} builders.")
        
        for b in builders:
            username = b.get("username")
            print(f"  [>] migrating builder: {username}")
            
            # Prepare data (handle lists/json)
            cur.execute("""
                INSERT INTO builders (
                    username, password, github_username, avatar, bio, 
                    building_style, interests, open_to, availability, 
                    current_idea, city, github_languages, github_repos, 
                    total_stars, public_repos, learning, experience_level, 
                    looking_for, email, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (username) DO UPDATE SET
                    password = EXCLUDED.password,
                    github_username = EXCLUDED.github_username,
                    avatar = EXCLUDED.avatar,
                    bio = EXCLUDED.bio,
                    building_style = EXCLUDED.building_style,
                    interests = EXCLUDED.interests,
                    open_to = EXCLUDED.open_to,
                    availability = EXCLUDED.availability,
                    current_idea = EXCLUDED.current_idea,
                    city = EXCLUDED.city,
                    github_languages = EXCLUDED.github_languages,
                    github_repos = EXCLUDED.github_repos,
                    total_stars = EXCLUDED.total_stars,
                    public_repos = EXCLUDED.public_repos,
                    learning = EXCLUDED.learning,
                    experience_level = EXCLUDED.experience_level,
                    looking_for = EXCLUDED.looking_for,
                    email = EXCLUDED.email,
                    updated_at = EXCLUDED.updated_at
            """, (
                b.get("username"), b.get("password"), b.get("github_username"), b.get("avatar"), b.get("bio"),
                b.get("building_style"), b.get("interests"), b.get("open_to"), b.get("availability"),
                b.get("current_idea"), b.get("city"), b.get("github_languages"), json.dumps(b.get("github_repos", [])),
                b.get("total_stars", 0), b.get("public_repos", 0), b.get("learning"), b.get("experience_level"),
                b.get("looking_for"), b.get("email"), b.get("created_at"), b.get("updated_at")
            ))

        # 2. Migrate Sessions
        sessions = data.get("sessions", {})
        print(f"[migrate] found {len(sessions)} sessions.")
        for sid, info in sessions.items():
            username = info.get("username") if isinstance(info, dict) else info
            created_at = info.get("created_at") if isinstance(info, dict) else None
            
            cur.execute("""
                INSERT INTO sessions (session_id, username, created_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (session_id) DO NOTHING
            """, (sid, username, created_at))

        conn.commit()
        cur.close()
        conn.close()
        print("[migrate] migration completed successfully.")

    except Exception as e:
        print(f"[migrate] Error: {e}")

if __name__ == "__main__":
    migrate()
