from google import genai
from google.genai import types
import os
from dotenv import load_dotenv


def get_matches(bio1: str, bio2: str):
    # Load environment variables from .env file
    load_dotenv()

    # Initialize the client
    # Expects GOOGLE_API_KEY to be in environment variables
    # We might want to initialize this outside if we want to reuse the client, 
    # but for now, this is safe and follows the original pattern.
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

    prompt = f"""
    You are the 'Partners Synergy Engine by Yahya'. Your goal is to find long-term co-founders, not just hackathon teammates.
    
    THE VISION:
    - Look past buzzwords. Use high-reasoning to find people who 'vibe' together technically and creatively.
    - Don't just check if they both know 'React'; check if their project histories and interests suggest they will complement each other (e.g., a Builder + a Designer, a Backend Engineer + a Frontend Engineer).
    - We are looking for high-potential co-founding pairs.
    - Ground all 2026 hackathon recommendations in real-world possibilities based on research.

    Analyze these validator profiles:
    Profile 1:
    {bio1}
    
    Profile 2:
    {bio2}

    Task:
    1. Calculate a 'Long-term Co-founder Compatibility Score' (0-100). Be strict. High scores should be rare and reserved for truly complementary pairs.
    2. Write a 'Synergy Analysis' explaining WHY they would (or wouldn't) make great co-founders. Focus on complementary skills and shared vision/vibes.
    3. Find 2 matching hackathons taking place in 2026 that would be perfect 'first dates' for them to build something together.

    Return the result as a raw JSON object (no markdown formatting) with the following structure:
    {{
        "compatibility_score": 85,
        "synergy_analysis": "...",
        "hackathons": [
            {{
                "name": "Hackathon Name",
                "date": "Date",
                "location": "Location or Online",
                "reasoning": "Why this specific event fits their combined skills."
            }},
            ...
        ]
    }}
    """

    print("Running Gemini 3 Pro with High Thinking Level and Google Search Grounding...")
    
    response = None
    try:
        # Try Gemini 3 Pro first
        print("Attempting with gemini-3-pro-preview...")
        response = client.models.generate_content(
            model='gemini-3-pro-preview',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                thinking_config=types.ThinkingConfig(include_thoughts=True)
            )
        )
    except Exception as e:
        if "RESOURCE_EXHAUSTED" in str(e) or "NOT_FOUND" in str(e) or "429" in str(e):
            print(f"Gemini 3 Pro unavailable ({e}). Falling back to Gemini 2.5 Pro...")
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-pro',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        # Thinking config might not be supported on 2.5 Pro standard
                    )
                )
            except Exception as e2:
                if "RESOURCE_EXHAUSTED" in str(e2) or "NOT_FOUND" in str(e2) or "429" in str(e2):
                    print(f"Gemini 2.5 Pro unavailable ({e2}). Falling back to Gemini 2.0 Flash...")
                    try:
                        response = client.models.generate_content(
                            model='gemini-2.0-flash',
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                tools=[types.Tool(google_search=types.GoogleSearch())],
                            )
                        )
                    except Exception as e3:
                        if "RESOURCE_EXHAUSTED" in str(e3) or "NOT_FOUND" in str(e3) or "429" in str(e3):
                            print(f"Gemini 2.0 Flash unavailable ({e3}). Falling back to Gemini 1.5 Flash...")
                            try:
                                response = client.models.generate_content(
                                    model='gemini-1.5-flash',
                                    contents=prompt,
                                    config=types.GenerateContentConfig(
                                        tools=[types.Tool(google_search=types.GoogleSearch())],
                                    )
                                )
                            except Exception as e4:
                                print(f"Detailed error: {e4}")
                                print("\nAll attempted models failed due to quota or availability issues.")
                                return None
                        else:
                            print(f"Detailed error: {e3}")
                            print("\nAll attempted models failed due to quota or availability issues.")
                            return None
                else:
                    print(f"Detailed error: {e2}")
                    print("\nAll attempted models failed due to quota or availability issues.")
                    return None
        else:
            print(f"Detailed error: {e}")
            print("\nAll attempted models failed due to quota or availability issues.")
            return None
    
    thoughts = ""
    if response:
        try:
            # Extract thoughts if available (Gemini Thinking models)
            if hasattr(response, 'candidates') and response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'thought') and part.thought:
                        thoughts += part.text + "\n"
            
            cleaned_text = response.text.strip()
            # Remove markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]
            
            import json
            result_json = json.loads(cleaned_text.strip())
            return {"result": result_json, "thoughts": thoughts.strip()}
        except Exception as e:
            print(f"Error parsing JSON from Gemini: {e}")
            return None
    return None

def generate_bio(github_url: str):
    """Generates a 3-sentence bio based on a GitHub URL."""
    load_dotenv()
    client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
    
    prompt = f"""
    You are the 'Partners Synergy Engine by Yahya'. 
    Analyze the following GitHub profile: {github_url}
    
    Tasks:
    1. Research the user's repositories, contributions, and bio.
    2. Generate a professional, compelling 3-sentence bio that highlights their technical specialty, key interests, and value as a potential co-founder.
    
    Return ONLY the 3-sentence bio text. No other commentary or formatting.
    """
    
    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
            )
        )
        return response.text.strip()
    except Exception as e:
        print(f"Error generating bio: {e}")
        return "Failed to generate bio. Please check the URL and try again."

def main():
    # Define the two developer profiles
    profile1 = """
    Name: Alice
    Skills: Python, AI/ML, Backend
    Interests: Healthcare, Social Good
    Experience: 3 years
    """
    
    profile2 = """
    Name: Bob
    Skills: JavaScript, React, Frontend
    Interests: FinTech, Blockchain
    Experience: 2 years
    """

    result = get_matches(profile1, profile2)
    if result:
        print("\n--- Response ---\n")
        import json
        print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
