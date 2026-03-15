import sys
import os
import json
import uuid
from datetime import datetime

# Setup environment
os.environ["DATABASE_URL"] = "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres"
sys.path.append('c:/Users/ya21/Downloads/pulsebuild/backend')

def run_diagnostics():
    print("--- BACKEND DIAGNOSTICS ---")
    
    # 1. Test Database Connection & JSONB registration
    print("[1] Testing Database connection...")
    try:
        from database import get_db_conn, get_builders
        conn = get_db_conn()
        print("    [+] Connection established.")
        
        # Test a query
        builders = get_builders()
        print(f"    [+] Successfully fetched {len(builders)} builders.")
        
        if builders:
            b = builders[0]
            print(f"    [+] First builder: {b['username']}")
            print(f"    [+] GitHub Repos type: {type(b.get('github_repos'))}")
            # If register_default_jsonb worked, this should be a list, not a string
            if isinstance(b.get('github_repos'), str):
                print("    [!] WARNING: github_repos is a STRING. JSONB registration failed or field is TEXT.")
            else:
                print("    [+] github_repos is correctly parsed as list/dict.")
        
        conn.close()
    except Exception as e:
        print(f"    [!] DB_ERROR: {e}")
        import traceback
        traceback.print_exc()

    # 2. Test Model Instantiation
    print("\n[2] Testing Model Instantiation (Pydantic)...")
    try:
        from main import BuilderProfile
        if builders:
            b = builders[0].copy()
            # Simulate the mapping logic in login/discover
            p_data = {k: v for k, v in b.items() if k not in ('password', 'email')}
            for d in ['created_at', 'updated_at']:
                if p_data.get(d) and hasattr(p_data[d], 'isoformat'):
                    p_data[d] = p_data[d].isoformat()
            
            # Convert any UUIDs to string
            for k, v in p_data.items():
                if isinstance(v, uuid.UUID):
                    p_data[k] = str(v)
            
            profile = BuilderProfile(**p_data)
            print(f"    [+] Successfully instantiated BuilderProfile for {b['username']}")
        else:
            print("    [?] No builders to test with.")
    except Exception as e:
        print(f"    [!] MODEL_ERROR: {e}")
        import traceback
        traceback.print_exc()

    print("\n--- DIAGNOSTICS COMPLETE ---")

if __name__ == "__main__":
    run_diagnostics()
