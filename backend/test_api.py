import requests
import json

url = "http://localhost:8000/match"
data = {
    "bio1": "Python developer with AI interest",
    "bio2": "Frontend developer with React interest"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=data, timeout=60) # Increased timeout
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
