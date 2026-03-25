from flask import Blueprint, request, jsonify
from extensions import limiter

route_bp = Blueprint("route", __name__)

@route_bp.route('/api/route', methods=['POST'])
@limiter.limit("30 per minute")  # Tmap rate limit as per PRD
def get_route():
    data = request.get_json()
    # In a real scenario, this would call Tmap API via proxy
    # For now, keeping the mock logic originally from app.py
    print(f"Route search request received: {data}")

    # Mock path data near Suwon Station
    mock_path = [
        [37.2664, 127.0002],
        [37.2675, 127.0015],
        [37.2685, 127.0025]
    ]

    return jsonify({
        "status": "success",
        "path": mock_path
    })
