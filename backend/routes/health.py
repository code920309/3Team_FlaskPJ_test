from flask import Blueprint, jsonify
from db import engine
from sqlalchemy import text
import structlog

log = structlog.get_logger()
health_bp = Blueprint("health", __name__)

@health_bp.route("/api/health")
def health():
    """
    Health check endpoint that verifies DB connectivity.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return jsonify({
            "status": "ok",
            "database": "connected",
            "message": "Backend and Database are healthy"
        })
    except Exception as e:
        log.error("health_check_failed", error=str(e))
        return jsonify({
            "status": "error",
            "database": str(e),
            "message": "Database connection failed"
        }), 500
