import os
import sys
from sqlalchemy import text
from db import engine

def check_schema():
    query = text("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'reports';
    """)
    try:
        with engine.connect() as conn:
            result = conn.execute(query)
            print("Columns in 'reports' table:")
            for row in result:
                print(f"- {row.column_name}: {row.data_type}")
    except Exception as e:
        print(f"Error checking schema: {e}")

if __name__ == "__main__":
    check_schema()
