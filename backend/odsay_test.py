import requests
import urllib.parse

API_KEY = "ezHyHNB1973AQ+4Zobzd0g"

# Method 1: Let requests encode the params
url1 = "https://api.odsay.com/v1/api/searchBusLane"
params1 = {
    "apiKey": API_KEY,
    "busNo": "10",
    "lang": 0,
    "output": "json"
}

print("=== METHOD 1 (requests params) ===")
try:
    res1 = requests.get(url1, params=params1)
    print("URL:", res1.url)
    print("Status:", res1.status_code)
    print("Response:", res1.json())
except Exception as e:
    print("Error:", e)

# Method 2: Manual URL string assembly
encoded_key = urllib.parse.quote(API_KEY)
url2 = f"https://api.odsay.com/v1/api/searchBusLane?apiKey={encoded_key}&busNo=10&lang=0&output=json"

print("\n=== METHOD 2 (manual url encoding) ===")
try:
    res2 = requests.get(url2)
    print("URL:", res2.url)
    print("Status:", res2.status_code)
    print("Response:", res2.json())
except Exception as e:
    print("Error:", e)
