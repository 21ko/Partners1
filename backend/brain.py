"""
Partners - brain.py
Primary:  Gemini 2.0 Flash (when API key present + quota available)
Fallback: Pure algorithm (zero cost, same output shape)
Security: No secrets logged, safe error handling
"""

from google import genai
import os
import json
import math
import random
import hashlib
from dotenv import load_dotenv

load_dotenv()

# ============================================
# SKILL TAXONOMY
# ============================================

LANGUAGE_GROUPS = {
    "frontend":  ["javascript", "typescript", "react", "nextjs", "vue", "svelte", "html", "css"],
    "backend":   ["python", "nodejs", "express", "fastapi", "django", "go", "rust", "java", "php", "ruby"],
    "mobile":    ["swift", "kotlin", "flutter", "dart"],
    "ml":        ["python", "pytorch", "tensorflow", "ml", "jupyter notebook"],
    "devops":    ["docker", "kubernetes", "aws", "gcp", "azure", "bash", "shell"],
    "database":  ["postgresql", "mongodb", "redis", "mysql", "sqlite"],
    "design":    ["figma", "css", "sass"],
    "systems":   ["rust", "c", "c++", "go", "assembly"],
}

def _get_categories(languages: list[str]) -> set[str]:
    cats = set()
    for lang in languages:
        normalized = lang.lower().strip()
        for cat, members in LANGUAGE_GROUPS.items():
            if normalized in members:
                cats.add(cat)
    return cats


# ============================================
# GEMINI CLIENT  (lazy init — only if key exists)
# ============================================

_gemini_client = None
_gemini_available = None  # None = untested, True/False = tested

def _get_gemini_client():
    """
    Returns Gemini client or None — never raises.
    Caches availability so we don't retry on every request after a failure.
    """
    global _gemini_client, _gemini_available

    if _gemini_available is False:
        return None  # Already failed — skip immediately

    api_key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if not api_key:
        _gemini_available = False
        return None

    try:
        if _gemini_client is None:
            _gemini_client = genai.Client(api_key=api_key)
        _gemini_available = True
        return _gemini_client
    except Exception as e:
        # Log that init failed but never log the key itself
        print(f"[brain] Gemini client init failed: {type(e).__name__}")
        _gemini_available = False
        return None


# ============================================
# BIO GENERATION
# ============================================

BIO_TEMPLATES = [
    ("ml",       [
        "Trains models at 2am and ships demos by morning",
        "Makes data do things it didn't know it could",
        "Builds AI that actually works, not just looks good in a notebook",
    ]),
    ("frontend", [
        "Makes UIs so clean people think a designer did it",
        "Turns Figma files into working products, fast",
        "Ships frontends before the backend is ready",
    ]),
    ("backend",  [
        "Builds APIs others build on top of",
        "Makes servers do more with less",
        "Writes backend code that doesn't wake anyone up at 3am",
    ]),
    ("mobile",   [
        "Ships apps people actually keep on their phone",
        "Makes mobile feel native, not ported",
    ]),
    ("devops",   [
        "Automates the boring so the team can ship the fun",
        "Makes deployments boring — which is the point",
    ]),
    ("systems",  [
        "Writes code measured in nanoseconds",
        "Makes hardware work harder",
    ]),
    ("design",   [
        "Designs things that feel obvious once you see them",
        "Turns user pain into something beautiful",
    ]),
]

FALLBACK_BIOS = [
    "Builds things for the love of it",
    "Ships projects, not decks",
    "Makes tools people actually use",
    "Codes on weekends because weekdays aren't enough",
    "Turns ideas into repos",
]

def _algo_bio(github_data: dict) -> str:
    """Pure algorithm bio — zero cost."""
    languages = [l.lower() for l in github_data.get("github_languages", [])]
    stars     = github_data.get("total_stars", 0)
    cats      = _get_categories(languages)

    for cat, templates in BIO_TEMPLATES:
        if cat in cats:
            bio = random.choice(templates)
            if stars > 100:
                bio += f" ({stars} stars and counting)"
            return bio

    return random.choice(FALLBACK_BIOS)


def analyze_github_profile(github_data: dict) -> str:
    """
    Generate casual 1-sentence bio.
    Tries Gemini first; falls back to algorithm template.
    """
    client = _get_gemini_client()

    if client:
        prompt = f"""
You write casual bios for developers who build things.

GitHub data:
- Languages: {', '.join(github_data.get('github_languages', [])[:3])}
- Top repos: {[r['name'] for r in github_data.get('github_repos', [])[:3]]}
- Total stars: {github_data.get('total_stars', 0)}

Write ONE sentence bio. Rules:
- NOT: "Experienced developer with expertise in..."
- YES: "Builds web apps at 2am and ships before coffee"
- Sound human, not corporate
- Max 80 characters

Return ONLY the bio. No quotes, no extra text.
"""
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            bio = response.text.strip().strip('"').strip("'")
            if bio and len(bio) > 5:
                return bio[:200]
        except Exception as e:
            print(f"[brain] Gemini bio failed ({type(e).__name__}) — using algorithm fallback")

    return _algo_bio(github_data)


# ============================================
# CORE SYNERGY SCORE  (your original, untouched)
# ============================================

def calculate_skill_synergy(user1: dict, user2: dict) -> int:
    score = 40

    interests1 = set(user1.get("interests", []))
    interests2 = set(user2.get("interests", []))
    score += len(interests1 & interests2) * 10

    knows1 = set(user1.get("github_languages", []))
    wants2 = set(user2.get("learning", []))
    score += len(knows1 & wants2) * 20

    knows2 = set(user2.get("github_languages", []))
    wants1 = set(user1.get("learning", []))
    score += len(knows2 & wants1) * 20

    if user1.get("building_style") == user2.get("building_style"):
        score += 15

    score += len(knows1 & knows2) * 5

    if (user1.get("city") and user2.get("city")
            and user1["city"].lower() == user2["city"].lower()):
        score += 15

    return min(100, score)


# ============================================
# ALGORITHM FALLBACK  (when Gemini unavailable)
# ============================================

def _vibe_label(score: int) -> str:
    if score >= 80: return "🔥 Strong vibe"
    if score >= 60: return "✨ Good match"
    return "🤝 Could work"


def _algo_why(user1: dict, user2: dict, score: int) -> str:
    parts = []

    knows1 = set(u.lower() for u in user1.get("github_languages", []))
    knows2 = set(u.lower() for u in user2.get("github_languages", []))
    wants1 = set(u.lower() for u in user1.get("learning", []))
    wants2 = set(u.lower() for u in user2.get("learning", []))

    teaches_1_to_2 = knows1 & wants2
    teaches_2_to_1 = knows2 & wants1

    if teaches_1_to_2:
        parts.append(f"you can teach them {list(teaches_1_to_2)[0].capitalize()}")
    if teaches_2_to_1:
        parts.append(f"they can teach you {list(teaches_2_to_1)[0].capitalize()}")

    cats1 = _get_categories(list(knows1))
    cats2 = _get_categories(list(knows2))

    if "frontend" in (cats2 - cats1) and "backend" in cats1:
        parts.append("full stack between you")
    elif "ml" in (cats2 - cats1) and "frontend" in cats1:
        parts.append("UI polish meets AI power")
    elif "ml" in (cats1 - cats2) and "frontend" in cats2:
        parts.append("AI power meets UI polish")
    elif "backend" in (cats2 - cats1) and "frontend" in cats1:
        parts.append("full stack between you")

    shared = set(user1.get("interests", [])) & set(user2.get("interests", []))
    if shared:
        parts.append(f"both into {list(shared)[0].replace('_', ' ')}")

    if (user1.get("building_style") and
            user1.get("building_style") == user2.get("building_style")):
        parts.append(f"same build style ({user1['building_style']})")

    levels = {"beginner": 1, "intermediate": 2, "advanced": 3, "expert": 4}
    l1 = levels.get(user1.get("experience_level", "intermediate"), 2)
    l2 = levels.get(user2.get("experience_level", "intermediate"), 2)
    if abs(l1 - l2) >= 2:
        parts.append("mentorship potential")

    city1 = user1.get("city", "")
    city2 = user2.get("city", "")
    if city1 and city2 and city1.lower() == city2.lower():
        parts.insert(0, f"📍 Both in {city1}!")

    if not parts:
        return ("Complementary builders — check out their profile."
                if score >= 70 else
                "Different angles on building — could spark something.")

    return " · ".join(parts).capitalize() + "."


PROJECT_IDEAS = [
    ({"ml", "frontend"},      "AI writing assistant with a slick web UI"),
    ({"ml", "backend"},       "API that classifies and routes data with a trained model"),
    ({"ml", "mobile"},        "On-device ML app — image or voice, no server needed"),
    ({"frontend", "backend"}, "Full-stack tool for a workflow you both find painful"),
    ({"frontend", "design"},  "Component library or design system from scratch"),
    ({"backend", "devops"},   "Self-hostable SaaS boilerplate with one-command deploy"),
    ({"mobile", "backend"},   "Real-time mobile app — chat, location, or live data"),
    ({"systems", "backend"},  "High-performance CLI tool or dev utility"),
    ({"devops", "backend"},   "Observability dashboard for your own projects"),
]

GENERIC_IDEAS = [
    "A weekend project around a shared frustration",
    "An open-source tool you both wish existed",
    "A no-fluff utility — build it in a weekend, ship it for real",
]

def _algo_build_idea(user1: dict, user2: dict) -> str:
    cats1 = _get_categories(user1.get("github_languages", []))
    cats2 = _get_categories(user2.get("github_languages", []))
    combined = cats1 | cats2

    for required, idea in PROJECT_IDEAS:
        if required.issubset(combined):
            shared = set(user1.get("interests", [])) & set(user2.get("interests", []))
            if shared:
                return f"{idea} — focused on {list(shared)[0].replace('_', ' ')}"
            return idea

    shared = set(user1.get("interests", [])) & set(user2.get("interests", []))
    if shared:
        return f"An open-source tool for the {list(shared)[0].replace('_', ' ')} space"

    return random.choice(GENERIC_IDEAS)


def _algo_match(user1: dict, user2: dict, base_score: int) -> dict:
    """Full algorithm match result — zero cost."""
    return {
        "chemistry_score": base_score,
        "vibe":            _vibe_label(base_score),
        "why":             _algo_why(user1, user2, base_score),
        "build_idea":      _algo_build_idea(user1, user2),
    }


# ============================================
# MAIN MATCH FUNCTION
# ============================================

def find_build_matches(user1: dict, user2: dict, local_only: bool = False) -> dict:
    """
    Match two builders.
    1. Calculate base score (always — your original algorithm)
    2. Try Gemini for vibe + idea (if available)
    3. Fall back to algorithm if Gemini fails or is unavailable
    Same output shape either way.
    """
    base_score = calculate_skill_synergy(user1, user2)

    if local_only and user1.get("city") != user2.get("city"):
        base_score = 0

    client = _get_gemini_client()

    if client:
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

Rate their BUILD CHEMISTRY (NOT professional fit).
Return ONLY valid JSON (no markdown, no extra text):
{{
  "chemistry_score": 0-100,
  "vibe": "🔥 Strong vibe" or "✨ Good match" or "🤝 Could work",
  "why": "one casual sentence why they'd work well",
  "build_idea": "one concrete project they could make together"
}}
"""
        try:
            response = client.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt
            )
            text = response.text.strip()

            # Strip markdown fences if present
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]

            result = json.loads(text.strip())

            # Blend: algorithm score is ground truth, Gemini adjusts ±20%
            ai_adjustment = (int(result.get("chemistry_score", 50)) - 50) / 4
            final_score = max(0, min(100, int(base_score + ai_adjustment)))
            result["chemistry_score"] = final_score

            # Add city tag if same city
            city1 = user1.get("city", "")
            city2 = user2.get("city", "")
            if city1 and city2 and city1.lower() == city2.lower():
                result["why"] = f"📍 Both in {city1}! " + result.get("why", "")

            return result

        except json.JSONDecodeError:
            print("[brain] Gemini returned invalid JSON — using algorithm fallback")
        except Exception as e:
            print(f"[brain] Gemini match failed ({type(e).__name__}) — using algorithm fallback")

    # Gemini unavailable or failed — full algorithm fallback
    return _algo_match(user1, user2, base_score)


# ============================================
# DEMO MODE  (kept exactly)
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


# ============================================
# SMOKE TEST  —  python brain.py
# ============================================

if __name__ == "__main__":
    yahya = {
        "username": "yahya",
        "github_languages": ["Python", "TypeScript"],
        "interests": ["devtools", "open_source", "web"],
        "learning": ["react", "docker"],
        "building_style": "weekend hacker",
        "experience_level": "intermediate",
        "city": "Paris",
        "current_idea": "builder matching platform",
        "availability": "weekends",
    }
    alice = {
        "username": "alice",
        "github_languages": ["TypeScript", "React", "CSS"],
        "interests": ["web", "devtools"],
        "learning": ["python", "fastapi"],
        "building_style": "weekend hacker",
        "experience_level": "intermediate",
        "city": "Paris",
        "current_idea": "design system",
        "availability": "weekends",
    }
    bob = {
        "username": "bob",
        "github_languages": ["Python", "Jupyter Notebook", "PyTorch"],
        "interests": ["ai_ml", "health"],
        "learning": ["react"],
        "building_style": "deep diver",
        "experience_level": "advanced",
        "city": "London",
        "current_idea": "medical image classifier",
        "availability": "evenings",
    }

    print("=== Bio (algorithm mode — no API key needed) ===")
    print(f"yahya: {analyze_github_profile(yahya)}")
    print(f"alice: {analyze_github_profile(alice)}")
    print(f"bob:   {analyze_github_profile(bob)}")

    print("\n=== Match: yahya <-> alice ===")
    print(json.dumps(find_build_matches(yahya, alice), indent=2, ensure_ascii=True))

    print("\n=== Match: yahya <-> bob ===")
    print(json.dumps(find_build_matches(yahya, bob), indent=2, ensure_ascii=True))
