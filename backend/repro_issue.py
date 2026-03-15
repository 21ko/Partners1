import httpx
import sys
import os

# Set DB_URL for the local test
os.environ["DATABASE_URL"] = "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres"

def test_discover():
    # We can't easily run the FastAPI app and hit it in one script without uvicorn/threading
    # But we can test the logic by importing it
    sys.path.append('c:/Users/ya21/Downloads/pulsebuild/backend')
    from main import discover_builders
    import asyncio

    async def run():
        print("Testing discover_builders()...")
        
        from database import get_builders
        from main import BuilderProfile
        
        builders = get_builders()
        print(f"Database contains {len(builders)} builders.")
        
        for i, b in enumerate(builders):
            try:
                # Mimic the mapping logic in main.py
                p_data = {k: v for k, v in b.items() if k not in ('password', 'email')}
                for d in ['created_at', 'updated_at']:
                    if p_data.get(d) and hasattr(p_data[d], 'isoformat'):
                        p_data[d] = p_data[d].isoformat()
                
                # Try to instantiate the model
                profile = BuilderProfile(**p_data)
                print(f"  [+] Builder {i+1} ({b['username']}): OK")
            except Exception as e:
                print(f"  [!] Builder {i+1} ({b['username']}): FAILED validation: {e}")

    asyncio.run(run())

if __name__ == "__main__":
    test_discover()
