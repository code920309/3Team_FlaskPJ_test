from sqlalchemy import create_engine
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv("DATABASE_URL")

if database_url:
    engine = create_engine(
        database_url,
        poolclass=NullPool,
        pool_pre_ping=True,
    )
else:
    # Fallback for local testing if DATABASE_URL is not set
    engine = create_engine(
        "sqlite:///:memory:",
        poolclass=NullPool,
        pool_pre_ping=True,
    )
