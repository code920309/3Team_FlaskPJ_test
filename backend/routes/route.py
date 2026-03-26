import os
import requests
import structlog
from flask import Blueprint, request, jsonify

# structlog 전역 로거 인스턴스
logger = structlog.get_logger()

route_bp = Blueprint('route_bp', __name__)

# ==========================================
# 휠체어 전용 경로 및 소요시간 탐색 API (티맵 프록시)
# ==========================================
@route_bp.route('/calculate', methods=['POST'])
def calculate_route():
    data = request.get_json()
    start = data.get('start_place')
    end = data.get('end_place')

    # .env에서 티맵 키 로드
    TMAP_KEY = os.environ.get('TMAP_APP_KEY')

    # 키 누락 시 보안 로그 작성 후 500 에러 반환
    if not TMAP_KEY:
        logger.error("TMAP_APP_KEY is missing in environment variables.")
        return jsonify({"error": "Internal server configuration error"}), 500

    try:
        headers = {
            "appKey": TMAP_KEY,
            "Accept": "application/json"
        }

        # Tmap 보행자 경로 API Payload
        payload = {
            "startX": start['lng'],
            "startY": start['lat'],
            "endX": end['lng'],
            "endY": end['lat'],
            "reqCoordType": "WGS84GEO",
            "resCoordType": "WGS84GEO",
            "startName": "출발지",
            "endName": "도착지",
            # 보행자 경로 중 계단/경사로 우회 옵션이 있다면 여기에 추가
            "searchOption": "30" # 예시: 계단 제외 옵션 (API 문서 확인 필요)
        }

        url = "https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1"

        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        tmap_data = response.json()

        logger.info("Tmap wheelchair route calculation completed", start=start, end=end)

        # -------------------------------------------------------------
        # [휠체어 단일 경로 로직]
        # API 응답에서 휠체어가 이동 가능한 최종 경로 좌표와
        # 총 소요 시간(totalTime)만 추출 및 정제하여 프론트로 전달
        # -------------------------------------------------------------

        return jsonify({
            "status": "success",
            "data": {
                "route_data": tmap_data, # 정제된 경로 데이터 (임시로 원본 전달)
                "message": "휠체어 경로 및 소요시간 탐색 완료"
            }
        })

    except requests.exceptions.RequestException as e:
        logger.exception("Tmap API request failed", error=str(e))
        return jsonify({"error": "Failed to calculate route from external service"}), 502
    except Exception as e:
        logger.exception("Unexpected error during route calculation", error=str(e))
        return jsonify({"error": "Internal server error"}), 50
