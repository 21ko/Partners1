import requests
import json

url = "http://localhost:8000/generate-bio"
data = {
    "github_url": "https://github.com/torvalds"
}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, json=data, timeout=60)
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
