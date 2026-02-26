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

def calculate_skill_synergy(user1: dict, user2: dict) -> int:
    """
    Programmatic matching algorithm to calculate base chemistry score.
    Higher efficiency, no LLM cost.
    """
    score = 40  # Start with baseline
    
    # 1. Shared Interests (+10 each)
    interests1 = set(user1.get('interests', []))
    interests2 = set(user2.get('interests', []))
    shared_interests = interests1 & interests2
    score += len(shared_interests) * 10
    
    # 2. Mentor/Learner Bonus (+20 each)
    # User1 knows what User2 wants to learn
    knows1 = set(user1.get('github_languages', []))
    wants2 = set(user2.get('learning', []))
    mentor_bonus1 = len(knows1 & wants2)
    score += mentor_bonus1 * 20
    
    # User2 knows what User1 wants to learn
    knows2 = set(user2.get('github_languages', []))
    wants1 = set(user1.get('learning', []))
    mentor_bonus2 = len(knows2 & wants1)
    score += mentor_bonus2 * 20
    
    # 3. Building Style Alignment (+15)
    if user1.get('building_style') == user2.get('building_style'):
        score += 15
        
    # 4. Shared Languages (+5 each)
    shared_langs = knows1 & knows2
    score += len(shared_langs) * 5
    
    # 5. City Bonus (+15 if same city)
    if user1.get('city') and user2.get('city') and user1['city'].lower() == user2['city'].lower():
        score += 15
        
    return min(100, score)

# ============================================
# MATCHING LOGIC
# ============================================

def find_build_matches(user1: dict, user2: dict, local_only: bool = False) -> dict:
    """
    Match two builders based on BUILD CHEMISTRY.
    Combines programmatic synergy with LLM vibe check.
    """
    # 1. Calculate programmatic base score
    base_score = calculate_skill_synergy(user1, user2)
    
    # If local_only is requested and cities don't match, drop score significantly
    if local_only and user1.get('city') != user2.get('city'):
        base_score = 0
        
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
        
        # Combine base_score (logic) with LLM insight
        # AI can adjust score by +/- 20% based on "vibe"
        ai_adjustment = (int(result.get('chemistry_score', 50)) - 50) / 4
        final_score = int(base_score + ai_adjustment)
        result['chemistry_score'] = max(0, min(100, final_score))
        
        # Add city flavor to "why" if same city
        if user1.get('city') and user1.get('city') == user2.get('city'):
            result['why'] = f"📍 Both in {user1['city']}! " + result['why']
            
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