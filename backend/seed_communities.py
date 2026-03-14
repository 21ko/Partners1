from database import create_community, get_communities, join_community
import os

def seed():
    existing = get_communities()
    if existing:
        print(f"[seed] {len(existing)} communities already exist. skipping.")
        return

    print("[seed] pre-populating communities...")
    
    cities = [
        ("Paris Builders", "Community for developers and makers in Paris.", "city"),
        ("London Tech", "Building the future in London.", "city"),
        ("Berlin Hackers", "Berlin-based builders and founders.", "city"),
        ("San Francisco Hub", "Connect with builders in the heart of SF.", "city"),
        ("Casablanca Devs", "Growing the tech ecosystem in Casablanca.", "city")
    ]
    
    interests = [
        ("AI Builders", "Everything LLMs, agents, and generative AI.", "interest"),
        ("Frontend Hub", "React, Vue, Design Systems, and UI polish.", "interest"),
        ("Backend Mastery", "Scalable systems, databases, and infra.", "interest"),
        ("Mobile Makers", "Flutter, Swift, Kotlin & cross-platform apps.", "interest")
    ]
    
    hackathons = [
        ("Global Build Week 2026", "A 1-week virtual hackathon for everyone.", "hackathon"),
        ("Open Source Sprint", "Let's contribute to meaningful projects together.", "hackathon")
    ]

    for name, desc, ctype in cities + interests + hackathons:
        cid = create_community(name, desc, type=ctype)
        print(f"  [+] created: {name} ({cid})")

    print("[seed] done.")

if __name__ == "__main__":
    seed()
