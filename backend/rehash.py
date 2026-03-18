import os
import psycopg2
import bcrypt
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv('.env')
url = os.environ.get('DATABASE_URL')
if not url:
    print("NO DATABASE_URL in .env")
    exit(1)
url = url.replace('postgres://', 'postgresql://')
if "sslmode" not in url:
    url += '&sslmode=require' if '?' in url else '?sslmode=require'
    
conn = psycopg2.connect(url, cursor_factory=RealDictCursor)

with conn.cursor() as cur:
    cur.execute("SELECT username, email, password FROM builders")
    builders = cur.fetchall()

    print(f"Found {len(builders)} builders.")
    for b in builders:
        pwd = b['password']
        user = b['username']
        
        if pwd and not (pwd.startswith('$2b$') or pwd.startswith('$2a$')):
            print(f"Rehashing password for {user}...")
            hashed = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
            cur.execute("UPDATE builders SET password = %s WHERE username = %s", (hashed, user))
        elif not pwd:
            pass
        
        if user == 'yahya':
            email_val = b['email']
            print(f"Yahya's DB email: {email_val}")

conn.commit()
print("Migration done!")
