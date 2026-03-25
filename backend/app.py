import os
from flask import Flask, jsonify
from flask_cors import CORS
import structlog
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
from extensions import limiter # Import shared limiter instance

# Sentry initialization
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    integrations=[FlaskIntegration()],
    traces_sample_rate=0.1,
)

app = Flask(__name__)
log = structlog.get_logger()

def create_cors_origins() -> list[str]:
    """Configure CORS allowed origins based on environment variables."""
    flask_env = os.getenv("FLASK_ENV", "development")
    if flask_env == "production":
        vite_domain = os.getenv("VITE_DOMAIN")
        if not vite_domain:
            raise EnvironmentError(
                "FLASK_ENV=production but VITE_DOMAIN is not set."
            )
        return [vite_domain]
    return ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]

# Middleware configurations
CORS(app, origins=create_cors_origins(), supports_credentials=True)
limiter.init_app(app) # Initialize limiter with flask app

@app.route('/')
def home():
    return "백엔드 서버가 아주 잘 돌아가고 있습니다! (v3.0)"

# Register Blueprints
from routes.transit import transit_bp
from routes.route import route_bp # Moved to routes/route.py for PRD compliance
from routes.health import health_bp

# Register all blueprints from PRD 8.2 logic
for bp in [transit_bp, route_bp, health_bp]:
    app.register_blueprint(bp)

if __name__ == '__main__':
    app.run(debug=True, port=int(os.getenv("PORT", 5000)))
