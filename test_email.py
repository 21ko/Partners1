import httpx

BASE_URL = "https://partners1-production.up.railway.app"

# Existing QA tester we just created
QA_USER = "final_qa_tester"
QA_PASS = "TestPass2026!"

def test_emails():
    print("Testing live emails over API...")
    with httpx.Client(timeout=30.0) as client:
        # Check if users already exist first (if the previous timeout succeeded server-side)
        r1 = client.post(f"{BASE_URL}/register", json={
            "username": "yahya_kossor",
            "password": "TestPassword123!",
            "github_username": "21ko",  
            "email": "yahya.kossor@edu.ece.fr",
            "city": "Paris",
            "interests": ["web", "python"],
            "learning": ["AI"],
            "building_style": "Deep dive"
        })
        print(f"Register yahya_kossor: {r1.status_code}")

        # Create user 2 
        r2 = client.post(f"{BASE_URL}/register", json={
            "username": "kossoryahy4",
            "password": "TestPassword123!",
            "github_username": "octocat",
            "email": "kossoryahy4@gmail.com",
            "city": "Paris",
            "interests": ["ml", "mobile"],
            "learning": ["frontend"],
            "building_style": "Fast shipper"
        })
        print(f"Register kossoryahy4: {r2.status_code}")

        # Get session from registration response
        session_id = None
        if r1.status_code == 200:
            session_id = r1.json().get("session_id")
        elif r2.status_code == 200:
            session_id = r2.json().get("session_id")
        else:
            print("Both registrations failed (user exists?). Will attempt matching directly with an old QA session if possible, but we don't have one.")
            # Let's just create a completely new user to get a session
            r3 = client.post(f"{BASE_URL}/register", json={
                "username": "final_qa_tester_77",
                "password": "TestPassword123!",
                "github_username": "octocat",
                "email": "dummy@test.com",
            })
            if r3.status_code == 200:
                session_id = r3.json().get("session_id")
            else:
                print("Failed to get any session id")
                
        if session_id:
            # Trigger match for user 1 (which sends email to user1)
            print("Requesting chemistry with yahya_kossor (triggers email)...")
            m1 = client.post(f"{BASE_URL}/match/yahya_kossor", params={"session_id": session_id})
            print(f"Match 1 result: {m1.status_code}")
            
            # Trigger match for user 2 (which sends email to kossoryahy4)
            print("Requesting chemistry with kossoryahy4 (triggers email)...")
            m2 = client.post(f"{BASE_URL}/match/kossoryahy4", params={"session_id": session_id})
            print(f"Match 2 result: {m2.status_code}")
            if m2.status_code != 200:
                print(m2.text)

if __name__ == "__main__":
    test_emails()
