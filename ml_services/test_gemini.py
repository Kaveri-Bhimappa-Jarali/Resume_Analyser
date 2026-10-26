import os
import requests

KEY = os.environ.get("GEMINI_API_KEY")
if not KEY:
    raise RuntimeError("Set GEMINI_API_KEY before running this test.")

models = ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-3.5-flash", "gemini-3.6-flash"]

for model in models:
    print(f"Testing model: {model}")
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
    headers = {"Content-Type": "application/json"}
    payload = {
        "contents": [{"parts": [{"text": "Hello, respond in one word."}]}]
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=10)
        print("Status:", r.status_code)
        print("Response:", r.text[:300])
    except Exception as e:
        print("Exception:", e)
    print("-" * 40)
