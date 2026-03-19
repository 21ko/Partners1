import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('.env')
url = os.environ.get('DATABASE_URL')
if not url:
    print("NO DATABASE_URL in .env")
    exit(1)
url = url.replace('postgres://', 'postgresql://')
if "sslmode" not in url:
    url += '&sslmode=require' if '?' in url else '?sslmode=require'
    
conn = psycopg2.connect(url)
cur = conn.cursor()

sql = """
CREATE TABLE IF NOT EXISTS follows (
    follower_username VARCHAR(255) REFERENCES builders(username) ON DELETE CASCADE,
    following_username VARCHAR(255) REFERENCES builders(username) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_username, following_username)
);
"""
cur.execute(sql)
conn.commit()
print("Migration done! Created follows.")
cur.close()
conn.close()
