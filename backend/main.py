from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import json
import uuid
import hashlib
import threading
from pathlib import Path
from datetime import datetime, timedelta
import httpx

from brain import analyze_github_profile, find_build_matches, get_demo_match

app = FastAPI(
    title="Partners API",
    version="1.0.0",
    description="Find someone to build with. No pitch decks. Just builders."
)

ALLOWED_ORIGINS = os.environ.get(
    "ALLOWED_ORIGINS",
    "https://partners1.vercel.app,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_TTL_DAYS = 30

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
# PASSWORD HASHING
# ============================================

def _hash_password(password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"sha256:{salt}:{hashed}"

def _check_password(password: str, stored: str) -> bool:
    if stored.startswith("sha256:"):
        try:
            _, salt, hashed = stored.split(":")
            return hashlib.sha256((salt + password).encode()).hexdigest() == hashed
        except Exception:
            return False
    return stored == password  # legacy plain-text


# ============================================
# DATA STORAGE  (thread-safe, no fcntl)
# ============================================

DATA_FILE = Path(__file__).parent / "builders.json"
_write_lock = threading.Lock()  # in-process lock, works on Railway


def init_data_file():
    if not DATA_FILE.exists():
        demo_data = {
            "builders": [
                {
                    "username": "alice",
                    "password": _hash_password("demo123"),
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
                    "password": _hash_password("demo123"),
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


def load_data() -> dict:
    with open(DATA_FILE, 'r') as f:
        data = json.load(f)

    for b in data.get('builders', []):
        b.setdefault('learning', [])
        b.setdefault('experience_level', 'intermediate')
        b.setdefault('looking_for', 'build_partner')
        b.setdefault('interests', [])
        b.setdefault('open_to', ["weekend projects", "hackathons"])
        b.setdefault('building_style', "figures_it_out")
        b.setdefault('github_languages', [])
        b.setdefault('github_repos', [])
        b.setdefault('total_stars', 0)
        b.setdefault('public_repos', 0)
        b.setdefault('avatar', f"https://api.dicebear.com/7.x/avataaars/svg?seed={b.get('username','anon')}")
        b.setdefault('bio', "")
        b.setdefault('email', "")
        b.setdefault('city', None)

    # Purge expired sessions
    cutoff = (datetime.now() - timedelta(days=SESSION_TTL_DAYS)).isoformat()
    data['sessions'] = {
        sid: s for sid, s in data.get('sessions', {}).items()
        if isinstance(s, dict) and s.get('created_at', '') >= cutoff
    }

    return data


def save_data(data: dict):
    """Thread-safe write - no fcntl needed."""
    with _write_lock:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)


def _get_session_username(data: dict, session_id: str) -> str:
    session = data.get('sessions', {}).get(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    if isinstance(session, dict):
        return session['username']
    return session  # legacy plain string


def _make_session(data: dict, username: str) -> str:
    session_id = str(uuid.uuid4())
    data['sessions'][session_id] = {
        "username": username,
        "created_at": datetime.now().isoformat()
    }
    return session_id


# ============================================
# GITHUB API
# ============================================

async def fetch_github_data(github_username: str) -> dict:
    """Fetch GitHub profile. Language bytes = accurate, not just repo counts."""
    try:
        async with httpx.AsyncClient() as client:
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

            repos_res = await client.get(
                f"https://api.github.com/users/{github_username}/repos?sort=updated&per_page=10",
                headers={"Accept": "application/vnd.github.v3+json"},
                timeout=10.0
            )
            repos = repos_res.json() if repos_res.status_code == 200 else []
            if not isinstance(repos, list):
                repos = []

            # Aggregate language bytes across repos (accurate signal for matching)
            lang_bytes: dict = {}
            for repo in repos[:5]:
                if not isinstance(repo, dict) or not repo.get('name'):
                    continue
                lang_res = await client.get(
                    f"https://api.github.com/repos/{github_username}/{repo['name']}/languages",
                    headers={"Accept": "application/vnd.github.v3+json"},
                    timeout=5.0
                )
                if lang_res.status_code == 200:
                    for lang, byte_count in lang_res.json().items():
                        lang_bytes[lang] = lang_bytes.get(lang, 0) + byte_count

            top_languages = sorted(lang_bytes, key=lang_bytes.get, reverse=True)[:5]

            return {
                "github_username": github_username,
                "avatar": profile.get("avatar_url", f"https://github.com/{github_username}.png"),
                "bio": profile.get("bio", "") or "",
                "github_languages": top_languages,
                "github_repos": [
                    {
                        "name": r.get("name", ""),
                        "description": r.get("description", ""),
                        "stars": r.get("stargazers_count", 0),
                        "language": r.get("language", "")
                    }
                    for r in repos[:5] if isinstance(r, dict)
                ],
                "total_stars": sum(
                    r.get("stargazers_count", 0) for r in repos if isinstance(r, dict)
                ),
                "public_repos": profile.get("public_repos", 0)
            }

    except HTTPException:
        raise
    except httpx.HTTPError as e:
        print(f"[main] GitHub fetch error: {type(e).__name__}")
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
# AUTH
# ============================================

@app.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest):
    data = load_data()

    if any(b['username'] == request.username for b in data['builders']):
        raise HTTPException(status_code=400, detail="Username already taken")

    github_data = await fetch_github_data(request.github_username)
    has_activity = len(github_data['github_repos']) > 0 or github_data['public_repos'] > 2

    bio = github_data['bio']
    if not bio or len(bio) < 10:
        bio = analyze_github_profile(github_data) if has_activity else "Builder looking to make things"

    now = datetime.now().isoformat()
    new_builder = {
        "username": request.username,
        "password": _hash_password(request.password),
        **github_data,
        "bio": bio,
        "building_style": "figures_it_out",
        "interests": [],
        "open_to": ["weekend projects", "hackathons"],
        "availability": "open",
        "current_idea": None,
        "email": request.email or "",
        "city": request.city or None,
        "learning": [],
        "experience_level": "intermediate",
        "looking_for": "build_partner",
        "created_at": now,
        "updated_at": now
    }

    data['builders'].append(new_builder)
    session_id = _make_session(data, request.username)
    save_data(data)

    profile = {k: v for k, v in new_builder.items() if k not in ('password', 'email')}
    return AuthResponse(
        session_id=session_id,
        profile=BuilderProfile(**profile),
        needs_onboarding=not has_activity
    )


@app.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    data = load_data()

    builder = next((b for b in data['builders'] if b['username'] == request.username), None)

    stored = builder['password'] if builder else "sha256:x:x"
    if not builder or not _check_password(request.password, stored):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Migrate legacy plain-text password on successful login
    if not builder['password'].startswith("sha256:"):
        builder['password'] = _hash_password(request.password)

    session_id = _make_session(data, request.username)
    save_data(data)

    profile = {k: v for k, v in builder.items() if k not in ('password', 'email')}
    return AuthResponse(session_id=session_id, profile=BuilderProfile(**profile))


# ============================================
# PROFILE
# ============================================

@app.post("/profile/update")
async def update_profile(request: UpdateProfileRequest):
    data = load_data()
    username = _get_session_username(data, request.session_id)
    builder = next((b for b in data['builders'] if b['username'] == username), None)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    for field in ['building_style', 'interests', 'open_to', 'availability',
                  'current_idea', 'city', 'learning', 'experience_level', 'looking_for']:
        val = getattr(request, field, None)
        if val is not None:
            builder[field] = val

    builder['updated_at'] = datetime.now().isoformat()
    save_data(data)

    profile = {k: v for k, v in builder.items() if k not in ('password', 'email')}
    return {"success": True, "profile": BuilderProfile(**profile)}


@app.get("/profile/{username}", response_model=BuilderProfile)
async def get_profile(username: str):
    data = load_data()
    builder = next((b for b in data['builders'] if b['username'] == username), None)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    profile = {k: v for k, v in builder.items() if k not in ('password', 'email')}
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
    data = load_data()
    builders = list(data['builders'])

    if session_id:
        try:
            current_username = _get_session_username(data, session_id)
            builders = [b for b in builders if b['username'] != current_username]
        except HTTPException:
            pass

    if filter_interest:
        builders = [b for b in builders if filter_interest in b.get('interests', [])]
    if filter_availability:
        builders = [b for b in builders if b.get('availability') == filter_availability]

    def sort_key(b):
        priority = 2 if b.get('availability') in ['this_weekend', 'this_month'] else (1 if b.get('current_idea') else 0)
        return (priority, b.get('updated_at', ''))

    builders.sort(key=sort_key, reverse=True)
    profiles = [{k: v for k, v in b.items() if k not in ('password', 'email')} for b in builders[:limit]]
    return [BuilderProfile(**p) for p in profiles]


@app.post("/match/{target_username}", response_model=MatchResponse)
async def get_match_analysis(target_username: str, session_id: str, local_only: bool = False):
    data = load_data()
    current_username = _get_session_username(data, session_id)

    current_builder = next((b for b in data['builders'] if b['username'] == current_username), None)
    target_builder  = next((b for b in data['builders'] if b['username'] == target_username), None)

    if not current_builder or not target_builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    match_result = get_demo_match(current_username, target_username)
    if not match_result:
        match_result = find_build_matches(current_builder, target_builder, local_only=local_only)
    if not match_result:
        raise HTTPException(status_code=500, detail="Failed to generate match")

    target_profile = {k: v for k, v in target_builder.items() if k not in ('password', 'email')}
    return MatchResponse(
        matched_builder=BuilderProfile(**target_profile),
        chemistry_score=match_result['chemistry_score'],
        vibe=match_result['vibe'],
        why=match_result['why'],
        build_idea=match_result['build_idea']
    )


# ============================================
# HEALTH
# ============================================

@app.get("/health")
async def health_check():
    data = load_data()
    return {
        "status": "ok",
        "version": "1.0.0",
        "total_builders": len(data['builders']),
        "active_sessions": len(data['sessions'])
    }

@app.get("/")
async def root():
    return {"name": "Partners API", "version": "1.0.0", "docs": "/docs", "health": "/health"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
