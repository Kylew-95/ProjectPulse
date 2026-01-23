import requests
from src.config import GEMINI_API_KEY
import json

url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"

response = requests.get(url)

if response.status_code == 200:
    models = response.json().get('models', [])
    print("AVAILABLE MODELS:")
    for m in models:
        if "generateContent" in m.get("supportedGenerationMethods", []):
            print(f"- {m['name']}")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
