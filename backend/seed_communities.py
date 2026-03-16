import os
import psycopg2
from database import DB_URL, get_db_conn

def seed():
    communities = [
        ("Paris Innov Hack", "The official sector for the 2026 Paris Innov hackathon. Build something bold.", "hackathon"),
        ("Weekend Warriors", "Casual builders shipping projects every Friday-Sunday.", "general"),
        ("AI Agents & LLMs", "Explorers building the next generation of agentic systems.", "interest"),
        ("Frontend Wizards", "UI/UX obsessed builders focusing on beautiful experiences.", "design"),
        ("Rust & Systems", "Hardcore low-level enthusiasts building high-performance systems.", "stack")
    ]

    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        print(f"Seeding {len(communities)} communities...")
        for name, desc, ctype in communities:
            cur.execute("""
                INSERT INTO communities (name, description, type)
                VALUES (%s, %s, %s)
                ON CONFLICT (name) DO NOTHING
            """, (name, desc, ctype))
        
        conn.commit()
        cur.close()
        conn.close()
        print("Done! Explore page should now have data.")
    except Exception as e:
        print(f"Seeding failed: {e}")
        print("Make sure DATABASE_URL is set correctly in your environment.")

if __name__ == "__main__":
    seed()
