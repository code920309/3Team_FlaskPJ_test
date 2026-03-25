import requests

API_KEY = "ezHyHNB1973AQ+4Zobzd0g"

# Method 3: Literal URL
url3 = f"https://api.odsay.com/v1/api/searchBusLane?apiKey={API_KEY}&busNo=10&lang=0&output=json"

class UnencodedAuthAdapter(requests.adapters.HTTPAdapter):
    # bypassing exact url logic
    pass

session = requests.Session()
# requests modifies URLs string internally, let's observe
print("=== METHOD 3 (literal) ===")
try:
    res3 = session.get(url3)
    print("URL:", res3.url)
    print("Status:", res3.status_code)
    print("Response:", res3.json())
except Exception as e:
    print("Error:", e)
