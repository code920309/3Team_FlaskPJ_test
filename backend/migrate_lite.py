import os
import traceback
from dotenv import load_dotenv

# dotenv 먼저 로드 (db 모듈 임포트 전)
current_dir = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(current_dir, ".env")
load_dotenv(dotenv_path)

from sqlalchemy import text
from db import engine

def ensure_reports_table():
    print("--- Ensuring Reports Table exists ---")
    try:
        with engine.connect() as conn:
            # 1. PostGIS 활성화 확인
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            
            # 2. 테이블 및 컬럼 확인/생성
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS reports (
                    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id     UUID        , -- FK to auth.users if needed
                    location    geometry(Point, 4326) NOT NULL,
                    type        TEXT        NOT NULL,
                    severity    INTEGER     NOT NULL DEFAULT 3,
                    description TEXT,
                    image_url   TEXT,
                    created_at  TIMESTAMPTZ DEFAULT now()
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_reports_location ON reports USING gist(location);"))
            conn.commit()
            print("Successfully ensured 'reports' table.")
            
            # 컬럼 추가 (추가된 경우를 위해)
            try:
                conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS severity INTEGER DEFAULT 3;"))
                conn.execute(text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_url TEXT;"))
                conn.commit()
            except Exception:
                pass
                
    except Exception:
        traceback.print_exc()

if __name__ == "__main__":
    ensure_reports_table()
