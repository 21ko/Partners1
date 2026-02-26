import requests
import json

BASE_URL = "http://localhost:8000"

def test_register(username, github_username):
    """Test user registration"""
    print(f"\nRegistering user: {username} (GitHub: {github_username})...")
    response = requests.post(f"{BASE_URL}/register", json={
        "username": username,
        "password": "testpass123",
        "github_username": github_username
    })
    print("Register Response:", response.status_code)
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    except:
        print("Error:", response.text)
        return None

def test_login(username):
    """Test user login"""
    print(f"\nLogging in user: {username}...")
    response = requests.post(f"{BASE_URL}/login", json={
        "username": username,
        "password": "testpass123"
    })
    print("Login Response:", response.status_code)
    data = response.json()
    print(json.dumps(data, indent=2))
    return data

if __name__ == "__main__":
    # Test 1: User with GitHub activity (should not need onboarding)
    # Using 'octocat' as it usually has repos
    result1 = test_register("octouser", "octocat")
    if result1 and 'needs_onboarding' in result1:
        print(f"Needs Onboarding: {result1['needs_onboarding']} (Expected: False/True depending on repos)")

    # Test 2: User with no GitHub activity (should need onboarding)
    # Using a likely fake/new user
    result2 = test_register("newuser", "nonexistent_user_123456789")
    if result2 and 'needs_onboarding' in result2:
        print(f"Needs Onboarding: {result2['needs_onboarding']} (Expected: True)")

    # Test 3: Login
    if result1:
        login_result = test_login("octouser")
        print("Login needs_onboarding:", login_result.get('needs_onboarding'))
