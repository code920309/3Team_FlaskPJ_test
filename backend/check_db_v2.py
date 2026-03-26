import os
import traceback
from dotenv import load_dotenv
from sqlalchemy import text
from db import engine

load_dotenv()

def check_db():
    print("--- Database Check ---")
    try:
        with engine.connect() as conn:
            # 1. PostGIS check
            res_gis = conn.execute(text("SELECT postgis_version();"))
            print(f"PostGIS Version: {res_gis.fetchone()[0]}")
            
            # 2. Table check
            res_tabs = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"))
            tables = [r[0] for r in res_tabs]
            print(f"Tables found: {tables}")
            
            if 'reports' in tables:
                res_cols = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'reports';"))
                print("Columns in 'reports':")
                for r in res_cols:
                    print(f" - {r[0]}: {r[1]}")
            else:
                print("!!! ERROR: 'reports' table does not exist !!!")
                
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    check_db()
