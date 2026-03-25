from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os

# Initialize Limiter without app to allow blueprint decoration
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=os.getenv("REDIS_URL", "memory://"),
)
