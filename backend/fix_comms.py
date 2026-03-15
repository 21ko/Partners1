import sys
import os
import json

# Set DB_URL
os.environ["DATABASE_URL"] = "postgresql://postgres:0bgV4fHU1vmvCVjc@db.pgmznvpdzbfgluaicrog.supabase.co:5432/postgres"
sys.path.append('c:/Users/ya21/Downloads/pulsebuild/backend')

from database import get_builders, get_communities, join_community

def fix_membership():
    builders = get_builders()
    comms = get_communities()
    
    print(f"Checking {len(builders)} builders for community membership...")
    
    for b in builders:
        city = b.get('city')
        if city:
            # Find matching city community
            city_comm = next((c for c in comms if c['type'] == 'city' and city.lower() in c['name'].lower()), None)
            if city_comm:
                print(f"  [+] Joining {b['username']} to {city_comm['name']}...")
                join_community(city_comm['id'], b['username'])
            else:
                print(f"  [ ] No city hub found for {city} ({b['username']})")
        else:
            print(f"  [ ] No city set for {b['username']}")
            
    print("Done.")

if __name__ == "__main__":
    fix_membership()
