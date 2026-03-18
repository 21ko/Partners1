from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import json
import uuid
import re
from datetime import datetime
import httpx

from brain import analyze_github_profile, find_build_matches, get_demo_match
from emails import send_match_notification, send_welcome_email
from database import (
    get_builders,
    get_builder_by_username,
    upsert_builder,
    save_session,
    get_session_username,
    delete_session,
    delete_expired_sessions,
    get_communities,
    get_community_by_id,
    get_community_members,
    join_community as db_join_community,
    hash_password,
    verify_password,
)

app = FastAPI(
    title="Partners API",
    version="1.0.0",
    description="Find someone to build with. No pitch decks. Just builders."
)

# CORS: allow all origins for now (see CHANGELOG to-do for domain restriction)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

class CommunityResponse(BaseModel):
    id: str
    name: str
    description: str
    type: str
    members_count: int

class JoinCommunityRequest(BaseModel):
    session_id: str

class LogoutRequest(BaseModel):
    session_id: str

# Username: 3-30 chars, alphanumeric + underscore only
USERNAME_RE = re.compile(r'^[a-zA-Z0-9_]{3,30}$')

# ============================================
# HELPERS
# ============================================

def _row_to_dict(row) -> dict:
    """Convert a psycopg2 RealDictRow to a plain dict with safe defaults."""
    if row is None:
        return None
    d = dict(row)
    # github_repos comes back as string from JSONB — parse it
    if isinstance(d.get('github_repos'), str):
        try:
            d['github_repos'] = json.loads(d['github_repos'])
        except Exception:
            d['github_repos'] = []
    # Ensure list fields are never None
    for field in ['interests', 'open_to', 'github_languages', 'learning']:
        if d.get(field) is None:
            d[field] = []
    # Safe defaults
    d.setdefault('bio', '')
    d.setdefault('building_style', 'figures_it_out')
    d.setdefault('availability', 'open')
    d.setdefault('experience_level', 'intermediate')
    d.setdefault('looking_for', 'build_partner')
    d.setdefault('total_stars', 0)
    d.setdefault('public_repos', 0)
    d.setdefault('github_repos', [])
    d.setdefault('city', None)
    d.setdefault('current_idea', None)
    if not d.get('avatar'):
        d['avatar'] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={d.get('username', 'anon')}"
    # Ensure datetimes are strings
    for field in ['created_at', 'updated_at']:
        if d.get(field) and not isinstance(d[field], str):
            d[field] = d[field].isoformat()
    return d


def _safe_profile(row) -> BuilderProfile:
    """Convert a DB row to a BuilderProfile, stripping sensitive fields."""
    if row is None:
        return None
    d = _row_to_dict(row) if not isinstance(row, dict) else row.copy()
    d.pop('password', None)
    d.pop('email', None)
    return BuilderProfile(**d)

# ============================================
# GITHUB API
# ============================================

async def fetch_github_data(github_username: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            headers = {"Accept": "application/vnd.github.v3+json"}
            github_token = os.environ.get("GITHUB_TOKEN")
            if github_token:
                headers["Authorization"] = f"token {github_token}"

            profile_res = await client.get(
                f"https://api.github.com/users/{github_username}",
                headers=headers,
                timeout=10.0
            )
            if profile_res.status_code == 404:
                raise HTTPException(status_code=404, detail=f"GitHub user '{github_username}' not found")
            if profile_res.status_code != 200:
                err_text = profile_res.text
                print(f"[github] API Error for {github_username}: {profile_res.status_code} - {err_text}")
                raise HTTPException(status_code=500, detail="GitHub API error")

            profile = profile_res.json()

            repos_res = await client.get(
                f"https://api.github.com/users/{github_username}/repos?sort=updated&per_page=10",
                headers=headers,
                timeout=10.0
            )
            repos = repos_res.json() if repos_res.status_code == 200 else []

            languages = {}
            for repo_data in (repos if isinstance(repos, list) else [])[:5]:
                repo = repo_data if isinstance(repo_data, dict) else {}
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
                "total_stars": sum(
                    r.get("stargazers_count", 0) if isinstance(r, dict) else 0
                    for r in (repos if isinstance(repos, list) else [])
                ),
                "public_repos": profile.get("public_repos", 0)
            }
    except httpx.HTTPError as e:
        print(f"GitHub fetch error: {e}")
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
    if not USERNAME_RE.match(request.username):
        raise HTTPException(
            status_code=400,
            detail="Username must be 3-30 characters: letters, numbers, underscore only"
        )
    if len(request.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    if get_builder_by_username(request.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    github_data = await fetch_github_data(request.github_username)
    has_activity = len(github_data['github_repos']) > 0 or github_data['public_repos'] > 2

    bio = github_data['bio']
    if not bio or len(bio) < 10:
        bio = analyze_github_profile(github_data) if has_activity else "Builder looking to make things"

    now = datetime.now().isoformat()
    new_builder = {
        "username": request.username,
        "password": hash_password(request.password),
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

    upsert_builder(new_builder)

    session_id = str(uuid.uuid4())
    save_session(session_id, request.username)

    if request.email:
        send_welcome_email(request.email, request.username)

    profile = {k: v for k, v in new_builder.items() if k not in ('password', 'email')}
    return AuthResponse(
        session_id=session_id,
        profile=BuilderProfile(**profile),
        needs_onboarding=not has_activity
    )


@app.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    builder_raw = get_builder_by_username(request.username)
    builder = _row_to_dict(builder_raw) if builder_raw else None
    if not builder or not verify_password(request.password, builder_raw['password']):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    session_id = str(uuid.uuid4())
    save_session(session_id, request.username)

    return AuthResponse(
        session_id=session_id,
        profile=_safe_profile(builder),
        needs_onboarding=False
    )

@app.post("/logout")
async def logout(request: LogoutRequest):
    delete_session(request.session_id)
    return {"success": True}

# ============================================
# PROFILE ENDPOINTS
# ============================================

@app.post("/profile/update")
async def update_profile(request: UpdateProfileRequest):
    username = get_session_username(request.session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")

    builder = get_builder_by_username(username)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    updated = _row_to_dict(builder)

    if request.building_style is not None:   updated['building_style'] = request.building_style
    if request.interests is not None:        updated['interests'] = request.interests
    if request.open_to is not None:          updated['open_to'] = request.open_to
    if request.availability is not None:     updated['availability'] = request.availability
    if request.current_idea is not None:     updated['current_idea'] = request.current_idea
    if request.city is not None:             updated['city'] = request.city
    if request.email is not None:            updated['email'] = request.email
    if request.learning is not None:         updated['learning'] = request.learning
    if request.experience_level is not None: updated['experience_level'] = request.experience_level
    if request.looking_for is not None:      updated['looking_for'] = request.looking_for

    updated['updated_at'] = datetime.now().isoformat()
    upsert_builder(updated)

    profile = {k: v for k, v in updated.items() if k not in ('password', 'email')}
    return {"success": True, "profile": BuilderProfile(**profile)}


@app.get("/profile/{username}", response_model=BuilderProfile)
async def get_profile(username: str):
    builder = get_builder_by_username(username)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    return _safe_profile(builder)

# ============================================
# DISCOVERY & MATCHING
# ============================================

@app.get("/discover", response_model=List[BuilderProfile])
async def discover_builders(
    session_id: Optional[str] = None,
    limit: int = 20,
    filter_interest: Optional[str] = None,
    filter_availability: Optional[str] = None,
    local_only: bool = False
):
    current_username = get_session_username(session_id) if session_id else None
    current_builder = _row_to_dict(get_builder_by_username(current_username)) if current_username else None
    
    all_builders = [_row_to_dict(b) for b in get_builders()]

    # Exclude self
    if current_username:
        all_builders = [b for b in all_builders if b['username'] != current_username]

    # Filter by city if local_only is ON and we have a current user with a city
    if local_only and current_builder and current_builder.get('city'):
        my_city = current_builder['city'].lower().strip()
        all_builders = [
            b for b in all_builders 
            if b.get('city') and b.get('city').lower().strip() == my_city
        ]

    # Filter by skill — searches languages, interests, learning, bio, repo languages
    if filter_interest:
        search = filter_interest.lower().strip()
        def builder_matches(b):
            # Check github_languages (list)
            if any(search in str(lang).lower() for lang in b.get('github_languages', []) if lang):
                return True
            # Check interests (list)
            if any(search in str(i).lower() for i in b.get('interests', []) if i):
                return True
            # Check learning (list)
            if any(search in str(l).lower() for l in b.get('learning', []) if l):
                return True
            # Check bio (string)
            if search in b.get('bio', '').lower():
                return True
            # Check repo languages (list of dicts)
            repo_langs = [
                str(r.get('language', '')).lower()
                for r in b.get('github_repos', [])
                if r and isinstance(r, dict) and r.get('language')
            ]
            return any(search in lang for lang in repo_langs)
        all_builders = [b for b in all_builders if builder_matches(b)]

    if filter_availability:
        all_builders = [b for b in all_builders if b.get('availability') == filter_availability]

    def sort_key(b):
        priority = 2 if b.get('availability') in ['this_weekend', 'this_month'] else (1 if b.get('current_idea') else 0)
        return (priority, b.get('updated_at', ''))

    all_builders.sort(key=sort_key, reverse=True)

    profiles = []
    for b in all_builders[:limit]:
        b.pop('password', None)
        b.pop('email', None)
        profiles.append(BuilderProfile(**b))
    return profiles


@app.post("/match/{target_username}", response_model=MatchResponse)
async def get_match_analysis(target_username: str, session_id: str, local_only: bool = False):
    current_username = get_session_username(session_id)
    if not current_username:
        raise HTTPException(status_code=401, detail="Invalid session")

    current_builder = _row_to_dict(get_builder_by_username(current_username))
    target_builder  = _row_to_dict(get_builder_by_username(target_username))

    if not current_builder or not target_builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    demo_result  = get_demo_match(current_username, target_username)
    match_result = demo_result if demo_result else find_build_matches(
        current_builder, target_builder, local_only=local_only
    )

    if not match_result:
        raise HTTPException(status_code=500, detail="Failed to generate match")

    # Email the target if they have an email (skip demo matches)
    target_email = target_builder.get("email")
    if target_email and not demo_result:
        send_match_notification(
            to_email=target_email,
            to_username=target_username,
            from_username=current_username,
            from_avatar=current_builder.get("avatar", ""),
            chemistry_score=match_result['chemistry_score'],
            vibe=match_result['vibe'],
            why=match_result['why'],
            build_idea=match_result['build_idea'],
        )

    return MatchResponse(
        matched_builder=_safe_profile(target_builder),
        chemistry_score=match_result['chemistry_score'],
        vibe=match_result['vibe'],
        why=match_result['why'],
        build_idea=match_result['build_idea']
    )

# ============================================
# COMMUNITY ENDPOINTS
# ============================================

@app.get("/communities", response_model=List[CommunityResponse])
async def list_communities():
    rows = get_communities()
    return [
        CommunityResponse(
            id=str(row['id']),
            name=row['name'],
            description=row.get('description', ''),
            type=row.get('type', 'general'),
            members_count=int(row.get('members_count', 0))
        )
        for row in rows
    ]


@app.get("/communities/{community_id}/members")
async def list_community_members(community_id: str):
    comm = get_community_by_id(community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    members = get_community_members(community_id)
    return {
        "community_id": community_id,
        "community_name": comm['name'],
        "members": [_safe_profile(m) for m in members],
        "total": len(members)
    }


@app.post("/communities/{community_id}/join")
async def join_community_endpoint(community_id: str, request: JoinCommunityRequest):
    username = get_session_username(request.session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")

    comm = get_community_by_id(community_id)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    db_join_community(community_id, username)
    return {"success": True, "community": comm['name'], "message": f"Joined {comm['name']}"}

# ============================================
# HEALTH CHECK
# ============================================

@app.get("/health")
async def health_check():
    try:
        builders = get_builders()
        # Clean up stale sessions on every health check (runs ~every 5 min on Railway)
        try:
            delete_expired_sessions(days=30)
        except Exception:
            pass
        return {
            "status": "ok",
            "version": "1.1.0",
            "db": "ok",
            "total_builders": len(builders),
        }
    except Exception as e:
        return {
            "status": "degraded",
            "version": "1.1.0",
            "db": f"error: {type(e).__name__}",
            "total_builders": 0,
        }

@app.get("/")
async def root():
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
