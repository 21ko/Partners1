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
    email: Optional[str] = None
    city: Optional[str] = None

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
    email: Optional[str] = None
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
        data = json.load(f)
        # Ensure all builders have required fields (migration for old data)
        for b in data.get('builders', []):
            if 'learning' not in b: b['learning'] = []
            if 'experience_level' not in b: b['experience_level'] = 'intermediate'
            if 'looking_for' not in b: b['looking_for'] = 'build_partner'
            if 'interests' not in b: b['interests'] = []
            if 'open_to' not in b: b['open_to'] = ["weekend projects", "hackathons"]
            if 'building_style' not in b: b['building_style'] = "figures_it_out"
            if 'github_languages' not in b: b['github_languages'] = []
            if 'github_repos' not in b: b['github_repos'] = []
            if 'total_stars' not in b: b['total_stars'] = 0
            if 'public_repos' not in b: b['public_repos'] = 0
            if 'avatar' not in b: b['avatar'] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={b.get('username', 'anon')}"
            if 'bio' not in b: b['bio'] = ""
            if 'email' not in b: b['email'] = ""
            if 'city' not in b: b['city'] = None
        return data

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
            for repo_data in (repos if isinstance(repos, list) else [])[:5]:
                repo: dict = repo_data if isinstance(repo_data, dict) else {}
                lang = repo.get('language')
                if lang:
                    languages[lang] = languages.get(lang, 0) + 1
            
            return {
                "github_username": github_username,
                "avatar": profile.get("avatar_url", f"https://github.com/{github_username}.png"),
                "bio": profile.get("bio", ""),
                "github_languages": sorted(languages.keys(), key=languages.get, reverse=True)[:5],
                "github_repos": [
                    {
                        "name": r.get("name", "unknown"),
                        "description": r.get("description", ""),
                        "stars": r.get("stargazers_count", 0),
                        "language": r.get("language", "")
                    }
                    for r in (repos if isinstance(repos, list) else [])[:5]
                ],
                "total_stars": sum(r.get("stargazers_count", 0) if isinstance(r, dict) else 0 for r in (repos if isinstance(repos, list) else [])),
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
        "email": request.email,
        "city": request.city or None,
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
async def get_match_analysis(target_username: str, session_id: str, local_only: bool = False):
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
        match_result = find_build_matches(current_builder, target_builder, local_only=local_only)
    
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