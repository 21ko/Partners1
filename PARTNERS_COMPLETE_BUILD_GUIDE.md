# PARTNERS - COMPLETE BUILD GUIDE
## From Zero to Deployed Product in 11 Days

> **Last Updated:** Feb 23, 2026  
> **Author:** Yahya Kossor  
> **Vision:** Find someone to build with. No pitch decks. Just builders.

---

## TABLE OF CONTENTS

1. [Product Vision & Philosophy](#1-product-vision--philosophy)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [Database Schema](#3-database-schema)
4. [Backend API - Complete Implementation](#4-backend-api---complete-implementation)
5. [Frontend Components - Complete Implementation](#5-frontend-components---complete-implementation)
6. [AI Matching Logic](#6-ai-matching-logic)
7. [Deployment Guide](#7-deployment-guide)
8. [Testing & Verification](#8-testing--verification)
9. [Day-by-Day Build Schedule](#9-day-by-day-build-schedule)
10. [Post-Launch Roadmap](#10-post-launch-roadmap)

---

## 1. PRODUCT VISION & PHILOSOPHY

### The Core Idea
Partners solves one problem: **"I want to build something but have no one to build it with."**

NOT:
- ❌ A job board
- ❌ A professional networking site
- ❌ A startup co-founder matcher
- ❌ A LinkedIn clone

YES:
- ✅ A place to find people who like making things
- ✅ Weekend projects, hackathons, side projects
- ✅ Casual, low-pressure collaboration
- ✅ Based on what you WANT to build, not your resume

### Origin Story (Use This Everywhere)
```
"I went to Paris Innov Hack alone. 
Found teammates by luck. Had a great time.
But I kept thinking — why do I have to rely on luck for this?

So I built Partners."
```

### Target Users
1. **Hackathon attendees** (primary) - showing up alone, need teams
2. **Students/freshers** - learning to code, want project partners
3. **Weekend builders** - have ideas, need collaborators
4. **Solo devs** - tired of building alone

### Key Differentiators
- GitHub-first (auto-fetch profiles, no manual entry)
- Intent-based (what you want to build > what you've built)
- Fresher-friendly (empty GitHub? No problem - manual onboarding)
- Casual language (build chemistry, not synergy)
- Demo mode (works without API, zero cost for first 1000 users)

---

## 2. TECH STACK & ARCHITECTURE

### Backend
```
Language:     Python 3.11+
Framework:    FastAPI
AI:           Google Gemini 2.0 Flash (via google-genai SDK)
Data:         JSON file (builders.json) - migrate to PostgreSQL at 1K users
Auth:         Session-based (UUID tokens)
Deployment:   Railway.app
```

### Frontend
```
Language:     TypeScript
Framework:    React 18 + Vite
Styling:      Tailwind CSS
Animation:    Framer Motion
Fonts:        JetBrains Mono (hacker aesthetic)
Deployment:   Vercel
```

### External APIs
```
GitHub API:   Fetch public profiles (60 req/hour, no auth needed)
Gemini API:   Free tier - 1000 requests/day
```

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    USER (Browser)                       │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Vercel (Frontend)    │
         │  - React + Tailwind   │
         │  - Framer Motion      │
         └───────────┬───────────┘
                     │
                     │ HTTPS/JSON
                     │
                     ▼
         ┌───────────────────────┐
         │  Railway (Backend)    │
         │  - FastAPI            │
         │  - Session Auth       │
         └───────┬───────────────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌──────┐ ┌──────┐ ┌──────┐
    │GitHub│ │Gemini│ │ JSON │
    │ API  │ │ API  │ │ File │
    └──────┘ └──────┘ └──────┘
```

---

## 3. DATABASE SCHEMA

### File: `backend/builders.json`

```json
{
  "builders": [
    {
      "username": "alice",
      "password": "hashed_password_here",
      "github_username": "alice-dev",
      "avatar": "https://github.com/alice-dev.png",
      "bio": "Ships fast frontends and figures it out along the way",
      
      // Core matching fields
      "building_style": "ships_fast",
      "interests": ["web apps", "AI tools", "UI/UX"],
      "open_to": ["weekend projects", "hackathons", "freelance"],
      "availability": "this_weekend",
      "current_idea": "Building a voice-first AI assistant",
      "city": "Paris",
      
      // GitHub data (auto-fetched)
      "github_languages": ["TypeScript", "React", "Python"],
      "github_repos": [
        {
          "name": "voice-assistant",
          "description": "AI-powered voice commands",
          "stars": 23,
          "language": "TypeScript"
        }
      ],
      "total_stars": 45,
      "public_repos": 12,
      
      // For freshers with empty GitHub
      "learning": ["Machine Learning", "FastAPI"],
      "experience_level": "intermediate",
      "looking_for": "build_partner",
      
      // Metadata
      "created_at": "2026-02-23T10:00:00Z",
      "updated_at": "2026-02-23T15:30:00Z"
    }
  ],
  
  "sessions": {
    "550e8400-e29b-41d4-a716-446655440000": "alice"
  }
}
```

### Field Definitions

| Field | Type | Required | Options | Purpose |
|-------|------|----------|---------|---------|
| `username` | string | Yes | - | Unique identifier |
| `password` | string | Yes | - | Plaintext for MVP, hash in production |
| `github_username` | string | Yes | - | For GitHub API fetching |
| `avatar` | string | Yes | - | Profile picture URL |
| `bio` | string | Yes | - | AI-generated or manual |
| `building_style` | string | Yes | ships_fast, plans_first, designs_first, figures_it_out | How they work |
| `interests` | array | Yes | ["AI tools", "web apps", "mobile", "games", "open source", "dev tools", "creative"] | What they like building |
| `open_to` | array | Yes | ["weekend projects", "hackathons", "side projects", "remote collab", "freelance", "co-founder search"] | What they're open to |
| `availability` | string | Yes | this_weekend, this_month, open, busy | When they can build |
| `current_idea` | string | No | - | Optional: what they're thinking about |
| `city` | string | No | - | For local matching later |
| `github_languages` | array | Auto | - | Fetched from GitHub |
| `github_repos` | array | Auto | - | Top 5 repos |
| `total_stars` | number | Auto | - | Sum of all repo stars |
| `public_repos` | number | Auto | - | Count of public repos |
| `learning` | array | No | - | For freshers: what they're learning |
| `experience_level` | string | No | beginner, intermediate, advanced | Skill level |
| `looking_for` | string | No | mentor, build_partner, learning_buddy | Match type |
| `created_at` | string | Auto | ISO 8601 | Registration timestamp |
| `updated_at` | string | Auto | ISO 8601 | Last profile update |

---

## 4. BACKEND API - COMPLETE IMPLEMENTATION

### File Structure
```
backend/
├── main.py           # API routes and server
├── brain.py          # AI matching logic
├── builders.json     # Data storage
├── .env              # Environment variables
├── requirements.txt  # Python dependencies
└── Procfile          # Railway deployment config
```

### requirements.txt
```
fastapi==0.109.0
uvicorn==0.27.0
python-dotenv==1.0.0
google-genai==0.3.0
httpx==0.26.0
pydantic==2.5.0
```

### .env
```
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=8000
```

### Procfile (for Railway)
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### main.py - COMPLETE CODE

```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import json
import uuid
from pathlib import Path
from datetime import datetime
import httpx

# Import AI functions
from brain import analyze_github_profile, find_build_matches, get_demo_match

app = FastAPI(
    title="Partners API",
    version="1.0.0",
    description="Find someone to build with. No pitch decks. Just builders."
)

# CORS - allow all for development, restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production: ["https://partners.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# MODELS
# ============================================

class BuilderProfile(BaseModel):
    username: str
    github_username: str
    avatar: str
    bio: str
    building_style: str
    interests: List[str]
    open_to: List[str]
    availability: str
    current_idea: Optional[str] = None
    city: Optional[str] = None
    github_languages: List[str] = []
    github_repos: List[dict] = []
    total_stars: int = 0
    public_repos: int = 0
    learning: List[str] = []
    experience_level: str = "intermediate"
    looking_for: str = "build_partner"
    created_at: str
    updated_at: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    github_username: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    session_id: str
    profile: BuilderProfile
    needs_onboarding: bool = False

class UpdateProfileRequest(BaseModel):
    session_id: str
    building_style: Optional[str] = None
    interests: Optional[List[str]] = None
    open_to: Optional[List[str]] = None
    availability: Optional[str] = None
    current_idea: Optional[str] = None
    city: Optional[str] = None
    learning: Optional[List[str]] = None
    experience_level: Optional[str] = None
    looking_for: Optional[str] = None

class MatchResponse(BaseModel):
    matched_builder: BuilderProfile
    chemistry_score: int
    vibe: str
    why: str
    build_idea: str

# ============================================
# DATA STORAGE
# ============================================

DATA_FILE = Path(__file__).parent / "builders.json"

def init_data_file():
    """Initialize with demo builders if file doesn't exist"""
    if not DATA_FILE.exists():
        demo_data = {
            "builders": [
                {
                    "username": "alice",
                    "password": "demo123",
                    "github_username": "alice-dev",
                    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
                    "bio": "Ships fast frontends and figures it out along the way",
                    "building_style": "ships_fast",
                    "interests": ["web apps", "AI tools", "UI/UX"],
                    "open_to": ["weekend projects", "hackathons"],
                    "availability": "this_weekend",
                    "current_idea": "Building a voice-first AI assistant",
                    "city": "Paris",
                    "github_languages": ["TypeScript", "React", "Python"],
                    "github_repos": [],
                    "total_stars": 45,
                    "public_repos": 12,
                    "learning": [],
                    "experience_level": "intermediate",
                    "looking_for": "build_partner",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                },
                {
                    "username": "bob",
                    "password": "demo123",
                    "github_username": "bob-ml",
                    "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
                    "bio": "Turns ML research papers into production code",
                    "building_style": "plans_first",
                    "interests": ["AI tools", "open source", "dev tools"],
                    "open_to": ["side projects", "remote collab"],
                    "availability": "this_month",
                    "current_idea": None,
                    "city": "Paris",
                    "github_languages": ["Python", "PyTorch", "FastAPI"],
                    "github_repos": [],
                    "total_stars": 128,
                    "public_repos": 23,
                    "learning": [],
                    "experience_level": "advanced",
                    "looking_for": "build_partner",
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat()
                }
            ],
            "sessions": {}
        }
        with open(DATA_FILE, 'w') as f:
            json.dump(demo_data, f, indent=2)

init_data_file()

def load_data():
    with open(DATA_FILE, 'r') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

# ============================================
# GITHUB API
# ============================================

async def fetch_github_data(github_username: str) -> dict:
    """Fetch public GitHub profile data"""
    try:
        async with httpx.AsyncClient() as client:
            # Get user profile
            profile_res = await client.get(
                f"https://api.github.com/users/{github_username}",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10.0
            )
            
            if profile_res.status_code == 404:
                raise HTTPException(status_code=404, detail=f"GitHub user '{github_username}' not found")
            
            if profile_res.status_code != 200:
                raise HTTPException(status_code=500, detail="GitHub API error")
            
            profile = profile_res.json()
            
            # Get repositories
            repos_res = await client.get(
                f"https://api.github.com/users/{github_username}/repos?sort=updated&per_page=10",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10.0
            )
            repos = repos_res.json() if repos_res.status_code == 200 else []
            
            # Aggregate languages
            languages = {}
            for repo in repos[:5]:
                if repo.get('language'):
                    languages[repo['language']] = languages.get(repo['language'], 0) + 1
            
            return {
                "github_username": github_username,
                "avatar": profile.get("avatar_url", f"https://github.com/{github_username}.png"),
                "bio": profile.get("bio", ""),
                "github_languages": sorted(languages.keys(), key=languages.get, reverse=True)[:5],
                "github_repos": [
                    {
                        "name": r["name"],
                        "description": r.get("description", ""),
                        "stars": r["stargazers_count"],
                        "language": r.get("language", "")
                    }
                    for r in repos[:5]
                ],
                "total_stars": sum(r["stargazers_count"] for r in repos),
                "public_repos": profile.get("public_repos", 0)
            }
    except httpx.HTTPError as e:
        print(f"GitHub fetch error: {e}")
        # Return minimal data if GitHub fetch fails
        return {
            "github_username": github_username,
            "avatar": f"https://github.com/{github_username}.png",
            "bio": "",
            "github_languages": [],
            "github_repos": [],
            "total_stars": 0,
            "public_repos": 0
        }

# ============================================
# AUTH ENDPOINTS
# ============================================

@app.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    """Register new builder"""
    data = load_data()
    
    # Check if username exists
    if any(b['username'] == request.username for b in data['builders']):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Fetch GitHub data
    github_data = await fetch_github_data(request.github_username)
    
    # Determine if onboarding is needed (empty GitHub)
    has_activity = len(github_data['github_repos']) > 0 or github_data['public_repos'] > 2
    
    # Generate bio if GitHub bio is empty
    bio = github_data['bio']
    if not bio or len(bio) < 10:
        if has_activity:
            bio = analyze_github_profile(github_data)
        else:
            bio = "Builder looking to make things"
    
    # Create builder profile
    now = datetime.now().isoformat()
    new_builder = {
        "username": request.username,
        "password": request.password,  # TODO: hash in production!
        **github_data,
        "bio": bio,
        "building_style": "figures_it_out",  # Default
        "interests": [],
        "open_to": ["weekend projects", "hackathons"],
        "availability": "open",
        "current_idea": None,
        "city": None,
        "learning": [],
        "experience_level": "intermediate",
        "looking_for": "build_partner",
        "created_at": now,
        "updated_at": now
    }
    
    data['builders'].append(new_builder)
    
    # Create session
    session_id = str(uuid.uuid4())
    data['sessions'][session_id] = request.username
    
    save_data(data)
    
    # Remove password from response
    profile = {k: v for k, v in new_builder.items() if k != 'password'}
    
    return AuthResponse(
        session_id=session_id,
        profile=BuilderProfile(**profile),
        needs_onboarding=not has_activity
    )

@app.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login existing builder"""
    data = load_data()
    
    builder = next((b for b in data['builders'] if b['username'] == request.username), None)
    
    if not builder or builder['password'] != request.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create session
    session_id = str(uuid.uuid4())
    data['sessions'][session_id] = request.username
    save_data(data)
    
    profile = {k: v for k, v in builder.items() if k != 'password'}
    
    return AuthResponse(
        session_id=session_id,
        profile=BuilderProfile(**profile),
        needs_onboarding=False
    )

# ============================================
# PROFILE ENDPOINTS
# ============================================

@app.post("/profile/update")
async def update_profile(request: UpdateProfileRequest):
    """Update builder profile"""
    data = load_data()
    
    # Verify session
    if request.session_id not in data['sessions']:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    username = data['sessions'][request.session_id]
    builder = next((b for b in data['builders'] if b['username'] == username), None)
    
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    # Update fields
    if request.building_style:
        builder['building_style'] = request.building_style
    if request.interests is not None:
        builder['interests'] = request.interests
    if request.open_to is not None:
        builder['open_to'] = request.open_to
    if request.availability:
        builder['availability'] = request.availability
    if request.current_idea is not None:
        builder['current_idea'] = request.current_idea
    if request.city:
        builder['city'] = request.city
    if request.learning is not None:
        builder['learning'] = request.learning
    if request.experience_level:
        builder['experience_level'] = request.experience_level
    if request.looking_for:
        builder['looking_for'] = request.looking_for
    
    builder['updated_at'] = datetime.now().isoformat()
    
    save_data(data)
    
    profile = {k: v for k, v in builder.items() if k != 'password'}
    return {"success": True, "profile": BuilderProfile(**profile)}

@app.get("/profile/{username}", response_model=BuilderProfile)
async def get_profile(username: str):
    """Get public builder profile"""
    data = load_data()
    builder = next((b for b in data['builders'] if b['username'] == username), None)
    
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    profile = {k: v for k, v in builder.items() if k != 'password'}
    return BuilderProfile(**profile)

# ============================================
# DISCOVERY & MATCHING
# ============================================

@app.get("/discover", response_model=List[BuilderProfile])
async def discover_builders(
    session_id: Optional[str] = None,
    limit: int = 20,
    filter_interest: Optional[str] = None,
    filter_availability: Optional[str] = None
):
    """Browse all active builders"""
    data = load_data()
    
    builders = [b for b in data['builders']]
    
    # Exclude current user if authenticated
    if session_id and session_id in data['sessions']:
        current_username = data['sessions'][session_id]
        builders = [b for b in builders if b['username'] != current_username]
    
    # Apply filters
    if filter_interest:
        builders = [b for b in builders if filter_interest in b.get('interests', [])]
    
    if filter_availability:
        builders = [b for b in builders if b.get('availability') == filter_availability]
    
    # Sort: actively building > recently updated
    def sort_key(b):
        priority = 0
        if b.get('availability') in ['this_weekend', 'this_month']:
            priority = 2
        elif b.get('current_idea'):
            priority = 1
        return (priority, b.get('updated_at', ''))
    
    builders.sort(key=sort_key, reverse=True)
    
    # Remove passwords
    profiles = [{k: v for k, v in b.items() if k != 'password'} for b in builders[:limit]]
    
    return [BuilderProfile(**p) for p in profiles]

@app.post("/match/{target_username}", response_model=MatchResponse)
async def get_match_analysis(target_username: str, session_id: str):
    """Get AI match analysis between current user and target"""
    data = load_data()
    
    # Verify session
    if session_id not in data['sessions']:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    current_username = data['sessions'][session_id]
    
    current_builder = next((b for b in data['builders'] if b['username'] == current_username), None)
    target_builder = next((b for b in data['builders'] if b['username'] == target_username), None)
    
    if not current_builder or not target_builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    # Try demo match first (instant, zero cost)
    demo_result = get_demo_match(current_username, target_username)
    
    if demo_result:
        match_result = demo_result
    else:
        # Call AI matching (uses API)
        match_result = find_build_matches(current_builder, target_builder)
    
    if not match_result:
        raise HTTPException(status_code=500, detail="Failed to generate match")
    
    target_profile = {k: v for k, v in target_builder.items() if k != 'password'}
    
    return MatchResponse(
        matched_builder=BuilderProfile(**target_profile),
        chemistry_score=match_result['chemistry_score'],
        vibe=match_result['vibe'],
        why=match_result['why'],
        build_idea=match_result['build_idea']
    )

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    data = load_data()
    return {
        "status": "ok",
        "version": "1.0.0",
        "total_builders": len(data['builders']),
        "active_sessions": len(data['sessions'])
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "Partners API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# ============================================
# SERVER
# ============================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
```

### brain.py - COMPLETE CODE

```python
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
import json

load_dotenv()

def get_gemini_client():
    """Initialize Gemini client"""
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found in environment")
    return genai.Client(api_key=api_key)

# ============================================
# BIO GENERATION
# ============================================

def analyze_github_profile(github_data: dict) -> str:
    """
    Generate casual 1-sentence bio from GitHub data.
    NOT corporate. Sounds like a real human.
    """
    client = get_gemini_client()
    
    prompt = f"""
You write casual bios for developers who build things.

GitHub data:
- Languages: {', '.join(github_data.get('github_languages', [])[:3])}
- Top repos: {[r['name'] for r in github_data.get('github_repos', [])[:3]]}
- Total stars: {github_data.get('total_stars', 0)}

Write ONE sentence bio. Rules:
- NOT: "Experienced developer with expertise in..."
- YES: "Builds web apps at 2am and ships before coffee"
- NOT: "Passionate about creating innovative solutions"
- YES: "Makes tools that people actually use"
- Sound human, not corporate
- Max 80 characters

Return ONLY the bio. No quotes, no extra text.
"""
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        bio = response.text.strip().strip('"').strip("'")
        return bio[:200]
    except Exception as e:
        print(f"Bio generation error: {e}")
        langs = github_data.get('github_languages', [])
        if langs:
            return f"Builds things with {langs[0]}"
        return "Builder who makes things"

# ============================================
# MATCHING LOGIC
# ============================================

def find_build_matches(user1: dict, user2: dict) -> dict:
    """
    Match two builders based on BUILD CHEMISTRY.
    Returns chemistry score, vibe, reasoning, and build idea.
    """
    client = get_gemini_client()
    
    # Build prompt
    prompt = f"""
You match builders who want to make things together. NOT co-founders. Just people who like building.

BUILDER 1:
- Interests: {', '.join(user1.get('interests', []))}
- Building style: {user1.get('building_style', 'unknown')}
- Languages: {', '.join(user1.get('github_languages', [])[:4])}
- Current idea: {user1.get('current_idea', 'exploring')}
- Availability: {user1.get('availability', 'unknown')}
- Learning: {', '.join(user1.get('learning', []))}
- Level: {user1.get('experience_level', 'intermediate')}

BUILDER 2:
- Interests: {', '.join(user2.get('interests', []))}
- Building style: {user2.get('building_style', 'unknown')}
- Languages: {', '.join(user2.get('github_languages', [])[:4])}
- Current idea: {user2.get('current_idea', 'exploring')}
- Availability: {user2.get('availability', 'unknown')}
- Learning: {', '.join(user2.get('learning', []))}
- Level: {user2.get('experience_level', 'intermediate')}

Rate their BUILD CHEMISTRY (NOT professional fit):
- Shared interests?
- Complementary skills? (one knows what other is learning = good!)
- Could they build something fun this weekend?
- Different levels? (beginner + advanced = mentorship!)

Return ONLY valid JSON (no markdown):
{{
  "chemistry_score": 0-100,
  "vibe": "🔥 Strong vibe" or "✨ Good match" or "🤝 Could work",
  "why": "one casual sentence why they'd work well",
  "build_idea": "one concrete project they could make (be specific)"
}}

Be honest. Low scores are fine. Focus on what they could BUILD together.
"""
    
    try:
        # Try Gemini 2.0 Flash first
        response = client.models.generate_content(
            model='gemini-2.0-flash-exp',
            contents=prompt
        )
        
        # Clean and parse response
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        
        result = json.loads(text.strip())
        
        # Validate
        required = ['chemistry_score', 'vibe', 'why', 'build_idea']
        if not all(k in result for k in required):
            raise ValueError("Invalid response structure")
        
        # Clamp score to 0-100
        result['chemistry_score'] = max(0, min(100, int(result['chemistry_score'])))
        
        return result
        
    except Exception as e:
        print(f"Match generation error: {e}")
        
        # Fallback: simple compatibility based on shared interests
        shared_interests = set(user1.get('interests', [])) & set(user2.get('interests', []))
        shared_learning = set(user1.get('learning', [])) & set(user2.get('learning', []))
        
        # Check if one teaches what other learns
        teaches = (set(user1.get('github_languages', [])) & set(user2.get('learning', []))) or \
                  (set(user2.get('github_languages', [])) & set(user1.get('learning', [])))
        
        score = 35  # Base score
        if shared_interests:
            score += len(shared_interests) * 15
        if shared_learning:
            score += len(shared_learning) * 10
        if teaches:
            score += 25
        
        score = min(90, score)
        
        return {
            "chemistry_score": score,
            "vibe": "🔥 Strong vibe" if score > 80 else "✨ Good match" if score > 60 else "🤝 Could work",
            "why": f"You both want to build {list(shared_interests)[0]}" if shared_interests else "Complementary skills could work well",
            "build_idea": "A weekend project combining your skills"
        }

# ============================================
# DEMO MODE (Zero API Cost)
# ============================================

DEMO_MATCHES = {
    ("alice", "bob"): {
        "chemistry_score": 92,
        "vibe": "🔥 Strong vibe",
        "why": "Alice ships fast frontends, Bob has ML power — perfect for AI apps",
        "build_idea": "A voice-controlled productivity app with AI summaries"
    },
    ("bob", "alice"): {
        "chemistry_score": 92,
        "vibe": "🔥 Strong vibe",
        "why": "Bob's models need Alice's polish — she makes AI feel magical",
        "build_idea": "A real-time code review assistant powered by local LLMs"
    }
}

def get_demo_match(username1: str, username2: str) -> dict:
    """Get preloaded demo match (instant, zero cost)"""
    key = (username1, username2)
    return DEMO_MATCHES.get(key, None)
```

---

## 5. FRONTEND COMPONENTS - COMPLETE IMPLEMENTATION

### File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── BuilderCard.tsx
│   │   └── MatchChemistry.tsx
│   ├── pages/
│   │   ├── AuthPage.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Discover.tsx
│   │   ├── Profile.tsx
│   │   └── Onboarding.tsx
│   ├── services/
│   │   └── authService.ts
│   ├── types.ts
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

### package.json
```json
{
  "name": "partners-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "framer-motion": "^11.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.6.2",
    "vite": "^6.0.3"
  }
}
```

### src/types.ts
```typescript
export interface Builder {
  username: string;
  github_username: string;
  avatar: string;
  bio: string;
  building_style: 'ships_fast' | 'plans_first' | 'designs_first' | 'figures_it_out';
  interests: string[];
  open_to: string[];
  availability: 'this_weekend' | 'this_month' | 'open' | 'busy';
  current_idea?: string;
  city?: string;
  github_languages: string[];
  github_repos: GithubRepo[];
  total_stars: number;
  public_repos: number;
  learning: string[];
  experience_level: 'beginner' | 'intermediate' | 'advanced';
  looking_for: 'mentor' | 'build_partner' | 'learning_buddy';
  created_at: string;
  updated_at: string;
}

export interface GithubRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
}

export interface MatchResult {
  matched_builder: Builder;
  chemistry_score: number;
  vibe: string;
  why: string;
  build_idea: string;
}

export interface Session {
  session_id: string;
  profile: Builder;
  needs_onboarding?: boolean;
}
```

### src/services/authService.ts
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authService = {
  async register(username: string, password: string, github_username: string) {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, github_username })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Registration failed');
    }
    
    const data = await res.json();
    this.saveSession(data);
    return data;
  },
  
  async login(username: string, password: string) {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Login failed');
    }
    
    const data = await res.json();
    this.saveSession(data);
    return data;
  },
  
  async updateProfile(session_id: string, updates: any) {
    const res = await fetch(`${API_URL}/profile/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id, ...updates })
    });
    
    if (!res.ok) throw new Error('Update failed');
    
    const data = await res.json();
    
    // Update session in localStorage
    const session = this.getSession();
    if (session) {
      session.profile = data.profile;
      this.saveSession(session);
    }
    
    return data;
  },
  
  saveSession(session: any) {
    localStorage.setItem('partners_session', JSON.stringify(session));
  },
  
  getSession() {
    const data = localStorage.getItem('partners_session');
    return data ? JSON.parse(data) : null;
  },
  
  clearSession() {
    localStorage.removeItem('partners_session');
  }
};
```

### index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    
    <!-- Hacker Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
    
    <title>Partners - Find someone to build with</title>
    
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Space Mono', monospace;
        background: #0A0F1C;
        color: #E2E8F0;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-family: 'JetBrains Mono', monospace;
      }
      
      code, pre {
        font-family: 'JetBrains Mono', monospace;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        terminal: {
          green: '#00FF41',
          blue: '#8BE9FD',
          purple: '#BD93F9',
          pink: '#FF79C6',
          cyan: '#50FA7B',
        }
      },
      animation: {
        'scan': 'scan 5s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        glow: {
          'from': { boxShadow: '0 0 5px #50FA7B, 0 0 10px #50FA7B' },
          'to': { boxShadow: '0 0 10px #50FA7B, 0 0 20px #50FA7B' }
        }
      }
    },
  },
  plugins: [],
}
```

---

*[Continuing in next message due to length limits...]*

## 6. AI MATCHING LOGIC

### Matching Algorithm Priorities

```
1. Shared Interests (30 points max)
   - Each shared interest = +15 points
   - e.g., both interested in "AI tools" = +15

2. Complementary Skills (40 points max)
   - One knows what other is learning = +25 points
   - Different experience levels (beginner + advanced) = +15 points
   
3. Building Style Compatibility (20 points max)
   - "ships_fast" + "plans_first" = +20 (good balance)
   - Same style = +10 (can work but less exciting)
   
4. Availability Match (10 points max)
   - Both "this_weekend" = +10
   - Different availability = +5

Total: 0-100 chemistry score
```

### Chemistry Score Interpretation

```
90-100: 🔥 Strong vibe      - Perfect match, build ASAP
75-89:  ✨ Good match       - Solid compatibility
60-74:  🤝 Could work       - Worth trying
0-59:   Not shown to user   - Skip this match
```

---

## 7. DEPLOYMENT GUIDE

### Backend Deployment (Railway)

**Step 1: Prepare Repository**
```bash
# Make sure these files exist:
backend/
├── main.py
├── brain.py
├── requirements.txt
├── Procfile
└── .env (local only, not committed)
```

**Step 2: Deploy to Railway**
1. Go to railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your Partners repo
4. Set root directory: `backend/`
5. Add environment variable: `GOOGLE_API_KEY=your_key`
6. Railway auto-detects Python and deploys
7. Copy your Railway URL: `https://partners-backend.railway.app`

**Step 3: Verify**
```bash
curl https://partners-backend.railway.app/health
# Should return: {"status":"ok","version":"1.0.0",...}
```

---

### Frontend Deployment (Vercel)

**Step 1: Prepare Repository**
```bash
# Make sure these files exist:
frontend/
├── src/
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

**Step 2: Deploy to Vercel**
1. Go to vercel.com
2. Click "New Project" → Import from GitHub
3. Select your Partners repo
4. Set root directory: `frontend/`
5. Set build command: `npm run build`
6. Set output directory: `dist`
7. Add environment variable:
   - `VITE_API_URL` = `https://partners-backend.railway.app`
8. Deploy

**Step 3: Verify**
- Visit your Vercel URL: `https://partners.vercel.app`
- Try registering with a GitHub username
- Should fetch GitHub data and create profile

---

## 8. TESTING & VERIFICATION

### Backend Tests

```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass","github_username":"octocat"}'

# Login
curl -X POST http://localhost:8000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass"}'

# Discover builders
curl http://localhost:8000/discover

# Get profile
curl http://localhost:8000/profile/alice
```

### Frontend Tests

**Manual Checklist:**
- [ ] Registration works with real GitHub username
- [ ] Login works
- [ ] Profile shows GitHub data (languages, repos, stars)
- [ ] Discover page shows all builders
- [ ] Filter by interest works
- [ ] Match chemistry shows score and build idea
- [ ] Animations feel smooth (not janky)
- [ ] Works on mobile (test on phone)
- [ ] Onboarding appears for users with empty GitHub

---

## 9. DAY-BY-DAY BUILD SCHEDULE

### Week 1: Foundation + Core Features

**Day 1 (Feb 22 - SAT): Rebuild & Deploy**
- [x] Replace backend with new vision (main.py, brain.py)
- [x] Update database schema (builders.json)
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Test end-to-end from phone

**Day 2 (Feb 23 - SUN): AI Quality**
- [ ] Improve matching prompt
- [ ] Add fresher onboarding flow
- [ ] Test with real GitHub usernames
- [ ] Fix any bugs from Day 1

**Day 3 (Feb 24 - MON): UI Glow-Up**
- [ ] Add framer-motion animations
- [ ] Implement hacker aesthetic (dark theme, monospace)
- [ ] Polish builder cards
- [ ] Improve chemistry visualization

**Day 4 (Feb 25 - TUE): Demo Mode**
- [ ] Add 5 demo builder profiles
- [ ] Preload demo matches
- [ ] Test with 0 API calls
- [ ] Verify it works without Gemini key

**Day 5 (Feb 26 - WED): Launch Prep**
- [ ] Final bug fixes
- [ ] Write launch posts
- [ ] Create demo video
- [ ] Update README

**Day 6 (Feb 27 - THU): Launch**
- [ ] Post on LinkedIn
- [ ] Post on Twitter
- [ ] Post on Reddit (r/hackathons, r/webdev)
- [ ] Post on HackerNews
- [ ] Target: 50 users

**Day 7 (Feb 28 - FRI): Feedback**
- [ ] Fix reported bugs
- [ ] Talk to 5 users
- [ ] Document what people want
- [ ] Plan Week 2

### Week 2: Polish + Growth

**Days 8-11 (Mar 1-4):**
- [ ] Add requested features from feedback
- [ ] Improve matching quality
- [ ] Add shareable profile cards
- [ ] Local matching (by city)
- [ ] Internship sprint (parallel)

---

## 10. POST-LAUNCH ROADMAP

### Phase 2 Features (Week 2-4)

**Must Have:**
- [ ] Email notifications (when someone wants to build with you)
- [ ] Basic messaging/contact system
- [ ] Profile editing improvements
- [ ] Search functionality

**Should Have:**
- [ ] Public shareable profiles (@username URLs)
- [ ] "Building now" live status
- [ ] City-based local matching
- [ ] Mobile app (React Native)

**Nice to Have:**
- [ ] LinkedIn integration
- [ ] Team formation (3-4 people)
- [ ] Hackathon calendar integration
- [ ] Success stories page

### Migration Plan (At 1K Users)

**When:** 
- JSON file gets slow (>1000 builders)
- Multiple concurrent writes cause conflicts
- Need complex queries

**How:**
1. Set up PostgreSQL database
2. Create migration script (JSON → PostgreSQL)
3. Update main.py to use SQLAlchemy
4. Test locally
5. Deploy during low-traffic hours
6. Keep JSON backup for 30 days

---

## APPENDIX: QUICK REFERENCE

### Environment Variables

```bash
# Backend (.env)
GOOGLE_API_KEY=your_gemini_key
PORT=8000

# Frontend (.env)
VITE_API_URL=https://partners-backend.railway.app
```

### Common Commands

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py

# Frontend
cd frontend
npm install
npm run dev

# Build for production
npm run build

# Deploy
git push origin main
# Railway and Vercel auto-deploy
```

### API Endpoints Quick Reference

```
POST   /register              - Create account
POST   /login                 - Sign in
GET    /profile/{username}    - View profile
POST   /profile/update        - Edit profile
GET    /discover              - Browse builders
POST   /match/{username}      - Get match analysis
GET    /health                - Health check
```

### Color Palette

```css
Background:    #0A0F1C (dark slate)
Text:          #E2E8F0 (light gray)
Primary:       #00FF41 (terminal green)
Secondary:     #8BE9FD (ice blue)
Accent:        #BD93F9 (purple)
Success:       #50FA7B (cyan)
Error:         #FF5555 (red)
```

---

## TROUBLESHOOTING

### Backend Issues

**"GitHub user not found"**
- Check GitHub username spelling
- User might have changed username
- GitHub API might be rate-limited (60 req/hour)

**"Gemini API error"**
- Check GOOGLE_API_KEY is set
- Verify API key is valid at aistudio.google.com
- Check free tier quota (1000 req/day)

**"Port already in use"**
```bash
lsof -ti:8000 | xargs kill -9
```

### Frontend Issues

**"Network error"**
- Check VITE_API_URL points to correct backend
- Verify backend is running
- Check CORS headers in backend

**"Build fails"**
```bash
rm -rf node_modules
npm install
npm run build
```

**"Animations laggy"**
- Check GPU acceleration enabled
- Reduce animation complexity
- Test on different device

---

## SUCCESS METRICS

### Week 1 Goals
- [ ] 50+ registered users
- [ ] 100+ matches generated
- [ ] 5+ real teams formed
- [ ] 0 critical bugs
- [ ] <500ms average API response time

### Month 1 Goals
- [ ] 500+ users
- [ ] 1000+ matches
- [ ] 50+ success stories
- [ ] Featured on Product Hunt
- [ ] First paid hackathon partnership

---

## FINAL CHECKLIST

Before calling Partners "done":

**Product:**
- [ ] Registration works flawlessly
- [ ] GitHub fetching is reliable
- [ ] Matching feels magical
- [ ] UI is beautiful and fast
- [ ] Works perfectly on mobile

**Infrastructure:**
- [ ] Backend deployed and stable
- [ ] Frontend deployed and fast
- [ ] Analytics tracking visits
- [ ] Error monitoring set up
- [ ] Backups configured

**Marketing:**
- [ ] README is impressive
- [ ] Demo video exists
- [ ] Launch posts written
- [ ] Social media ready
- [ ] Press kit prepared

**Business:**
- [ ] Clear value proposition
- [ ] User feedback collected
- [ ] Roadmap defined
- [ ] Monetization explored
- [ ] Legal basics covered (privacy policy)

---

**Built with ❤️ by Yahya Kossor**  
**Feb 22 - Mar 4, 2026**  
**"Find someone to build with. No pitch decks. Just builders."**

---

*END OF GUIDE*
