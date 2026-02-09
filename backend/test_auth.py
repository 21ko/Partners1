import requests
import json

BASE_URL = "http://localhost:8000"

def test_register():
    """Test user registration"""
    response = requests.post(f"{BASE_URL}/register", json={
        "username": "testuser",
        "password": "testpass123",
        "bio": "Full-stack developer passionate about AI and web3"
    })
    print("Register Response:", response.status_code)
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_login():
    """Test user login"""
    response = requests.post(f"{BASE_URL}/login", json={
        "username": "testuser",
        "password": "testpass123"
    })
    print("\nLogin Response:", response.status_code)
    print(json.dumps(response.json(), indent=2))
    return response.json()

def test_duplicate_register():
    """Test registering with existing username"""
    response = requests.post(f"{BASE_URL}/register", json={
        "username": "testuser",
        "password": "differentpass",
        "bio": "Another bio"
    })
    print("\nDuplicate Register Response:", response.status_code)
    print(response.json())

if __name__ == "__main__":
    print("Testing Registration...")
    register_result = test_register()
    
    print("\n" + "="*50)
    print("Testing Login...")
    login_result = test_login()
    
    print("\n" + "="*50)
    print("Testing Duplicate Registration...")
    test_duplicate_register()
    
    print("\n" + "="*50)
    print("Session IDs are unique:", register_result['session_id'] != login_result['session_id'])
