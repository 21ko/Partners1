from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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
from database import (
    get_builders, get_builder_by_username, upsert_builder,
    save_session, get_session_username, delete_expired_sessions
)

app = FastAPI(
    title="Partners API",
    version="1.0.0",
    description="Find someone to build with. No pitch decks. Just builders."
)

# Robust CORS for debugging and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    import traceback
    print(f"GLOBAL_ERROR: {exc}")
    traceback.print_exc()
    
    status_code = 500
    detail = "Internal Server Error"
    
    if hasattr(exc, "status_code"):
        status_code = exc.status_code
    if hasattr(exc, "detail"):
        detail = exc.detail
        
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*",
        "Access-Control-Allow-Headers": "*",
    }
    
    return JSONResponse(
        status_code=status_code,
        content={"status": "error", "detail": detail, "msg": str(exc)},
        headers=headers
    )

SESSION_TTL_DAYS = 30

# ============================================
# MODELS
# ============================================

class BuilderProfile(BaseModel):
    username: str
    github_username: str = ""
    avatar: str = ""
    bio: str = ""
    building_style: str = "figures_it_out"
    interests: List[str] = []
    open_to: List[str] = []
    availability: str = "open"
    current_idea: Optional[str] = None
    city: Optional[str] = None
    github_languages: List[str] = []
    github_repos: List[dict] = []
    total_stars: int = 0
    public_repos: int = 0
    learning: List[str] = []
    experience_level: str = "intermediate"
    looking_for: str = "build_partner"
    created_at: str = ""
    updated_at: str = ""

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


class Community(BaseModel):
    id: str
    name: str
    description: str
    type: str
    host_username: Optional[str] = None
    created_at: str


class CreateCommunityRequest(BaseModel):
    session_id: str
    name: str
    description: str
    type: str = 'general'


class JoinCommunityRequest(BaseModel):
    session_id: str


class CommunityMemberResponse(BaseModel):
    community_id: str
    members: List[BuilderProfile]


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

# Sessions are now handled in database


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
    try:
        existing = get_builder_by_username(request.username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

        github_data = await fetch_github_data(request.github_username)
        has_activity = len(github_data['github_repos']) > 0 or github_data['public_repos'] > 2

        bio = github_data['bio']
        if not bio or len(bio) < 10:
            bio = analyze_github_profile(github_data) if has_activity else "Builder looking to make things"

        new_builder = {
            "username": request.username,
            "password": _hash_password(request.password),
            "github_username": request.github_username,
            "avatar": github_data['avatar'],
            "bio": bio,
            "building_style": "weekend hacker",
            "interests": [],
            "open_to": [],
            "availability": "flexible",
            "github_languages": github_data['github_languages'],
            "github_repos": github_data['github_repos'],
            "total_stars": github_data['total_stars'],
            "public_repos": github_data['public_repos'],
            "learning": [],
            "experience_level": "intermediate",
            "looking_for": "build_partner",
            "email": request.email,
            "city": request.city or "Remote",
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        upsert_builder(new_builder)

        # Handle city hub
        if request.city:
            from database import get_communities, join_community
            all_comms = get_communities()
            city_comm = next((c for c in all_comms if c['name'].lower() == f"{request.city.lower()} hub"), None)
            if city_comm:
                join_community(city_comm['id'], request.username)

        session_id = str(uuid.uuid4())
        save_session(session_id, request.username)

        profile = {k: v for k, v in new_builder.items() if k not in ('password', 'email')}
        
        # Convert dates to strings for Pydantic
        for key, val in profile.items():
            if hasattr(val, 'isoformat'):
                profile[key] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                profile[key] = str(val)
        
        try:
            p_obj = BuilderProfile(**profile)
            return AuthResponse(
                session_id=session_id,
                profile=p_obj,
                needs_onboarding=not has_activity
            )
        except Exception as ve:
            print(f"[AUTH] Register Validation Error: {ve}")
            raise HTTPException(status_code=500, detail=f"Profile validation failed: {str(ve)}")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        err_msg = f"CRITICAL_REGISTER_ERROR: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        raise HTTPException(status_code=500, detail=err_msg)


@app.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    try:
        print(f"[AUTH] Detailed Login attempt: {request.username}")
        builder = get_builder_by_username(request.username)
        if not builder:
            print(f"[AUTH] User not found: {request.username}")
            raise HTTPException(status_code=401, detail="Invalid username or password")

        stored = builder.get('password', "sha256:x:x")
        if not _check_password(request.password, stored):
            print(f"[AUTH] Password mismatch: {request.username}")
            raise HTTPException(status_code=401, detail="Invalid username or password")

        # Migrate legacy plain-text password on successful login
        if not stored.startswith("sha256:"):
            builder['password'] = _hash_password(request.password)
            upsert_builder(builder)

        session_id = str(uuid.uuid4())
        save_session(session_id, request.username)

        # Convert to a clean dict and handle all non-JSON types
        profile_data = dict(builder)
        profile = {k: v for k, v in profile_data.items() if k not in ('password', 'email')}
        
        for key, val in profile.items():
            if hasattr(val, 'isoformat'):
                profile[key] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                profile[key] = str(val)

        # Final validation before response
        try:
            p_obj = BuilderProfile(**profile)
            return AuthResponse(session_id=session_id, profile=p_obj)
        except Exception as ve:
            print(f"[AUTH] Pydantic Validation Error: {ve}")
            raise HTTPException(status_code=500, detail=f"Profile validation failed: {str(ve)}")

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        err_msg = f"CRITICAL_LOGIN_ERROR: {str(e)}\n{traceback.format_exc()}"
        print(err_msg)
        raise HTTPException(status_code=500, detail=err_msg)


# ============================================
# PROFILE
# ============================================

@app.post("/profile/update")
async def update_profile(request: UpdateProfileRequest):
    username = get_session_username(request.session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    builder = get_builder_by_username(username)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    for field in ['building_style', 'interests', 'open_to', 'availability',
                  'current_idea', 'city', 'learning', 'experience_level', 'looking_for']:
        val = getattr(request, field, None)
        if val is not None:
            builder[field] = val

    builder['updated_at'] = datetime.now()
    upsert_builder(builder)

    profile = {k: v for k, v in builder.items() if k not in ('password', 'email')}
    for d in ['created_at', 'updated_at']:
        if profile.get(d) and hasattr(profile[d], 'isoformat'):
            profile[d] = profile[d].isoformat()
            
    return {"success": True, "profile": BuilderProfile(**profile)}


@app.get("/profile/{username}", response_model=BuilderProfile)
async def get_profile(username: str):
    builder = get_builder_by_username(username)
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    
    profile = {k: v for k, v in builder.items() if k not in ('password', 'email')}
    for key, val in profile.items():
        if hasattr(val, 'isoformat'):
            profile[key] = val.isoformat()
        elif isinstance(val, uuid.UUID):
            profile[key] = str(val)
            
    return BuilderProfile(**profile)


# ============================================
# DISCOVERY & MATCHING
# ============================================

@app.get("/discover", response_model=List[BuilderProfile])
async def discover_builders(
    session_id: Optional[str] = None,
    community_id: Optional[str] = None,
    limit: int = 20,
    filter_interest: Optional[str] = None,
    filter_availability: Optional[str] = None
):
    if community_id:
        from database import get_community_members
        builders = get_community_members(community_id)
    else:
        builders = get_builders()

    current_username = None
    if session_id:
        current_username = get_session_username(session_id)
        if current_username:
            builders = [b for b in builders if b['username'] != current_username]

    if filter_interest:
        builders = [b for b in builders if b.get('interests') and filter_interest in b.get('interests')]
    if filter_availability:
        builders = [b for b in builders if b.get('availability') == filter_availability]

    def sort_key(b):
        priority = 2 if b.get('availability') in ['this_weekend', 'this_month'] else (1 if b.get('current_idea') else 0)
        # Handle datetime comparison safely
        updated_at = b.get('updated_at')
        updated_at_str = updated_at.isoformat() if hasattr(updated_at, 'isoformat') else str(updated_at)
        return (priority, updated_at_str)

    builders.sort(key=sort_key, reverse=True)
    
    profiles = []
    for b in builders[:limit]:
        p = {k: v for k, v in b.items() if k not in ('password', 'email')}
        for key, val in p.items():
            if hasattr(val, 'isoformat'):
                p[key] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                p[key] = str(val)
        profiles.append(BuilderProfile(**p))
        
    return profiles


@app.post("/match/{target_username}", response_model=MatchResponse)
async def get_match_analysis(target_username: str, session_id: str, local_only: bool = False, community_id: Optional[str] = None):
    current_username = get_session_username(session_id)
    if not current_username:
        raise HTTPException(status_code=401, detail="Invalid session")

    current_builder = get_builder_by_username(current_username)
    target_builder  = get_builder_by_username(target_username)

    if not current_builder or not target_builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    # Match result from brain.py
    match_result = get_demo_match(current_username, target_username)
    if not match_result:
        # If community_id is provided, we could pass it to find_build_matches 
        # for extra context (e.g. hackathon matching), but brain.py doesn't support it yet.
        match_result = find_build_matches(current_builder, target_builder, local_only=local_only)
    
    if not match_result:
        raise HTTPException(status_code=500, detail="Failed to generate match")

    target_profile = {k: v for k, v in target_builder.items() if k not in ('password', 'email')}
    for d in ['created_at', 'updated_at']:
        if target_profile.get(d) and hasattr(target_profile[d], 'isoformat'):
            target_profile[d] = target_profile[d].isoformat()

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
    try:
        builders = get_builders()
        from database import get_communities
        comms = get_communities()
        return {
            "status": "ok",
            "version": "1.0.2",
            "database": "connected",
            "total_builders": len(builders),
            "total_communities": len(comms),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        print(f"[HEALTH] Database error: {e}")
        return {
            "status": "error",
            "version": "1.0.2",
            "database": "disconnected",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================
# COMMUNITY ENDPOINTS
# ============================================

@app.get("/communities", response_model=List[Community])
async def list_communities():
    from database import get_communities
    comms = get_communities()
    results = []
    for c in comms:
        # Convert UUIDs and datetimes to string for Pydantic
        row = dict(c)
        for key, val in row.items():
            if hasattr(val, 'isoformat'):
                row[key] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                row[key] = str(val)
        results.append(Community(**row))
    return results

@app.post("/communities", response_model=Community)
async def create_new_community(request: CreateCommunityRequest):
    username = get_session_username(request.session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    from database import create_community, get_community_by_id
    cid = create_community(request.name, request.description, username, request.type)
    comm = get_community_by_id(cid)
    if hasattr(comm['created_at'], 'isoformat'):
        comm['created_at'] = comm['created_at'].isoformat()
    return Community(**comm)

@app.post("/communities/{community_id}/join")
async def join_comm(community_id: str, request: JoinCommunityRequest):
    username = get_session_username(request.session_id)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    from database import join_community
    join_community(community_id, username)
    return {"success": True}

@app.get("/communities/{community_id}/members", response_model=CommunityMemberResponse)
async def list_members(community_id: str):
    from database import get_community_members
    builders = get_community_members(community_id)
    profiles = []
    for b in builders:
        p = {k: v for k, v in b.items() if k not in ('password', 'email')}
        for key, val in p.items():
            if hasattr(val, 'isoformat'):
                p[key] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                p[key] = str(val)
        profiles.append(BuilderProfile(**p))
    return CommunityMemberResponse(community_id=community_id, members=profiles)

@app.get("/")
async def root():
    return {"name": "Partners API", "version": "1.0.0", "docs": "/docs", "health": "/health"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
