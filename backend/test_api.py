import threading
import time
import requests
from app import app
import os

os.environ["FLASK_ENV"] = "development"

def run_server():
    app.run(port=5000, use_reloader=False)

server_thread = threading.Thread(target=run_server)
server_thread.daemon = True
server_thread.start()

time.sleep(2)

try:
    print("Testing DB Health...")
    res = requests.get("http://127.0.0.1:5000/api/health", timeout=3)
    print("Health Status Code:", res.status_code)
    print("Health JSON:", res.json())
except Exception as e:
    print("Health check failed:", e)

try:
    print("\nTesting Bus Station Info (ODsay proxy)...")
    res = requests.get("http://127.0.0.1:5000/api/transit/busStationInfo?stationID=107475", timeout=5)
    print("ODsay Station Status:", res.status_code)
    print("ODsay Station JSON (partial keys):", list(res.json().keys()))
except Exception as e:
    print("ODsay test failed:", e)
