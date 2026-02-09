from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from brain import get_matches, generate_bio
import uvicorn
import os
import json
import uuid
from pathlib import Path

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. In production, specify frontend URL.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MatchRequest(BaseModel):
    bio1: str
    bio2: str

class BioRequest(BaseModel):
    github_url: str

class BioResponse(BaseModel):
    bio: str

class RegisterRequest(BaseModel):
    username: str
    password: str
    bio: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    session_id: str
    username: str
    bio: str

# Path to users.json file
USERS_FILE = Path(__file__).parent / "users.json"

# Initialize users.json if it doesn't exist
if not USERS_FILE.exists():
    with open(USERS_FILE, 'w') as f:
        json.dump({"users": [], "sessions": {}}, f)

def load_users():
    with open(USERS_FILE, 'r') as f:
        return json.load(f)

def save_users(data):
    with open(USERS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.post("/register")
async def register(request: RegisterRequest):
    data = load_users()
    
    # Check if username already exists
    if any(user['username'] == request.username for user in data['users']):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Add new user
    new_user = {
        "username": request.username,
        "password": request.password,  # In production, hash this!
        "bio": request.bio
    }
    data['users'].append(new_user)
    
    # Create session
    session_id = str(uuid.uuid4())
    data['sessions'][session_id] = request.username
    
    save_users(data)
    
    return AuthResponse(
        session_id=session_id,
        username=request.username,
        bio=request.bio
    )

@app.post("/login")
async def login(request: LoginRequest):
    data = load_users()
    
    # Find user
    user = next((u for u in data['users'] if u['username'] == request.username), None)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    if user['password'] != request.password:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Create session
    session_id = str(uuid.uuid4())
    data['sessions'][session_id] = request.username
    
    save_users(data)
    
    return AuthResponse(
        session_id=session_id,
        username=user['username'],
        bio=user['bio']
    )

class UpdateBioRequest(BaseModel):
    session_id: str
    bio: str

@app.post("/update-bio")
async def update_bio(request: UpdateBioRequest):
    data = load_users()
    
    # Verify session
    if request.session_id not in data['sessions']:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    username = data['sessions'][request.session_id]
    
    # Find and update user
    user = next((u for u in data['users'] if u['username'] == username), None)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user['bio'] = request.bio
    save_users(data)
    
    return {"success": True, "bio": request.bio}

@app.post("/generate-bio")
async def get_github_bio(request: BioRequest):
    try:
        bio = generate_bio(request.github_url)
        return BioResponse(bio=bio)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match")
async def match_profiles(request: MatchRequest):
    try:
        # Call the Gemini function
        result_data = get_matches(request.bio1, request.bio2)
        
        if not result_data:
            raise HTTPException(status_code=500, detail="Failed to generate matches using Gemini.")
            
        return result_data # result_data is now {"result": ..., "thoughts": ...}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
