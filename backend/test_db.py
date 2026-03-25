from db import engine
from sqlalchemy import text
print("Engine:", engine)
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1")).fetchone()
        print("DB Select Success:", res)
except Exception as e:
    print("DB connection Failed:", e)
