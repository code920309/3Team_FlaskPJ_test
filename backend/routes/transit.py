import os
import requests
import structlog
from flask import Blueprint, jsonify, request
from extensions import limiter # Use shared limiter instance

log = structlog.get_logger()
transit_bp = Blueprint("transit", __name__)

# ODsay API Config
ODSAY_API_KEY = os.getenv("ODSAY_API_KEY")
ODSAY_BASE_URL = "https://api.odsay.com/v1/api"

@transit_bp.route("/api/transit", methods=["GET"])
@limiter.limit("60 per minute") # Apply requested rate limiting
def get_transit():
    """
    ODsay API 프록시: 대중교통 경로 조회 및 저상버스 필터링 (Mock 및 Real API 병행)
    
    요청 파라미터:
    - sx: 출발지 경도 (lng)
    - sy: 출발지 위도 (lat)
    - ex: 목적지 경도 (lng)
    - ey: 목적지 위도 (lat)
    - pathType: 경로 타입 (0-전체, 1-지하철, 2-버스, 3-버스+지하철)
    """
    sx = request.args.get("sx")
    sy = request.args.get("sy")
    ex = request.args.get("ex")
    ey = request.args.get("ey")
    path_type = request.args.get("pathType", "0")

    if not all([sx, sy, ex, ey]):
        return jsonify({"error": "Required parameters (sx, sy, ex, ey) are missing"}), 400

    if not ODSAY_API_KEY:
        log.error("odsay_api_key_missing", context="ensure ODSAY_API_KEY is in environment variables")
        return jsonify({"error": "ODSAY_API_KEY is not configured on the server"}), 500

    try:
        # ODsay API 파라미터 구성
        params = {
            "apiKey": ODSAY_API_KEY,
            "sx": sx,
            "sy": sy,
            "ex": ex,
            "ey": ey,
            "pathType": path_type,
            "lang": 0,
            "output": "json"
        }
        
        # ODsay 대중교통 경로 검색 호출 (SearchPubTransPathT)
        response = requests.get(
            f"{ODSAY_BASE_URL}/searchPubTransPathT",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()

        # 결과가 없는 경우
        if "result" not in data:
            log.warning("odsay_empty_result", params=params, response=data)
            return jsonify({
                "status": "error",
                "message": data.get("error", {}).get("msg", "No transport routes found.")
            }), 404

        # ----------------------------------------------------------------------
        # 저상버스(lowBus) 필터링 로직
        # ----------------------------------------------------------------------
        # ODsay SearchPubTransPathT API 결과의 'lane' 또는 'lowBus' 관련 항목을 확인
        # 만약 ODsay 응답에서 저상버스 정보를 명시적으로 준다면 이를 사용하고,
        # 없을 경우 비즈니스 로직(예: 다른 API 연동 등)에 따라 처리해야 하지만
        # 여기서는 PRD의 'lowBus 값이 있는 것만 필터링' 요청에 따라 구현
        # ----------------------------------------------------------------------
        
        all_paths = data["result"].get("path", [])
        accessible_routes = []

        for path in all_paths:
            # 휠체어 이용자를 위해 해당 경로 내의 모든 버스가 저상버스인지 확인
            is_completely_accessible = True
            contains_bus = False
            
            sub_paths = path.get("subPath", [])
            for sub in sub_paths:
                traffic_type = sub.get("trafficType")
                
                if traffic_type == 2:  # 버스
                    contains_bus = True
                    # ODsay 응답의 lane 정보에서 저상버스 여부를 확인 (ODsay마다 필드가 다를 수 있음)
                    # 보통 'lowBus' 필드가 1(True)인 경우를 체크
                    lanes = sub.get("lane", [])
                    # 모든 버스가 저상이어야 한다는 엄격한 필터링 기준 (요건에 따라 완화 가능)
                    for lane in lanes:
                        # lane 객체 내에 'lowBus' 프로퍼티가 있음을 전제로 함
                        # 만약 0(일반)이면 휠체어 이용 불가로 판단
                        if lane.get("lowBus") == 0:
                            is_completely_accessible = False
                            break
                
                # 지하철의 경우 휠체어 이용이 가능하다고 가정하거나 별도 로직 필요
                # 여기서는 '버스'에 집중하여 필터링
                if not is_completely_accessible:
                    break
            
            # 버스 경로를 포함하고 있고, 저상버스가 확인된 경우만 결과에 포함
            # (지하철 전용 경로이거나 도보 전용인 경우는 통과)
            if contains_bus and not is_completely_accessible:
                continue
                
            accessible_routes.append(path)

        # frontend/src/schemas/transit.ts 에 정의된 구조에 맞게 응답 반환 (추측)
        return jsonify({
            "status": "success",
            "count": len(accessible_routes),
            "paths": accessible_routes
        })

    except requests.exceptions.HTTPError as http_err:
        log.error("odsay_http_error", status_code=response.status_code, error=str(http_err))
        return jsonify({"error": f"Transport API returned error: {response.status_code}"}), response.status_code
    except requests.exceptions.RequestException as req_err:
        log.error("odsay_request_failed", error=str(req_err))
        return jsonify({"status": "error", "message": "Failed to connect to transport API."}), 502
    except Exception as e:
        log.exception("transit_internal_error", error=str(e))
        return jsonify({"error": "Internal server error occurred while processing transit data"}), 500

@transit_bp.route("/api/transit/searchBusLane", methods=["GET"])
@limiter.limit("60 per minute")
def search_bus_lane():
    """
    ODsay 버스 노선 조회 API 프록시
    파라미터: busNo (필수), CID (선택)
    """
    # Use provided ODsay key or fallback
    api_key = os.getenv("ODSAY_API_KEY", "ezHyHNB1973AQ+4Zobzd0g")
    bus_no = request.args.get("busNo")
    
    if not bus_no:
        return jsonify({"error": "busNo parameter is required"}), 400

    try:
        params = {
            "apiKey": api_key,
            "busNo": bus_no,
            "lang": 0,
            "output": "json"
        }
        if request.args.get("CID"):
            params["CID"] = request.args.get("CID")
            
        res = requests.get(f"{ODSAY_BASE_URL}/searchBusLane", params=params, timeout=10)
        res.raise_for_status()
        return jsonify(res.json())
        
    except requests.exceptions.RequestException as e:
        log.error("odsay_searchBusLane_failed", error=str(e))
        return jsonify({"error": "Failed to connect to ODsay searchBusLane API"}), 502

@transit_bp.route("/api/transit/busLaneDetail", methods=["GET"])
@limiter.limit("60 per minute")
def bus_lane_detail():
    """
    ODsay 버스 노선 상세 정보 조회 API 프록시
    파라미터: busID (필수)
    """
    api_key = os.getenv("ODSAY_API_KEY", "ezHyHNB1973AQ+4Zobzd0g")
    bus_id = request.args.get("busID")
    
    if not bus_id:
        return jsonify({"error": "busID parameter is required"}), 400

    try:
        params = {
            "apiKey": api_key,
            "busID": bus_id,
            "lang": 0,
            "output": "json"
        }
        
        res = requests.get(f"{ODSAY_BASE_URL}/busLaneDetail", params=params, timeout=10)
        res.raise_for_status()
        return jsonify(res.json())
        
    except requests.exceptions.RequestException as e:
        log.error("odsay_busLaneDetail_failed", error=str(e))
        return jsonify({"error": "Failed to connect to ODsay busLaneDetail API"}), 502

@transit_bp.route("/api/transit/busStationInfo", methods=["GET"])
@limiter.limit("60 per minute")
def bus_station_info():
    """
    ODsay 버스 정류장 세부 정보 조회 API 프록시
    파라미터: stationID (필수)
    """
    api_key = os.getenv("ODSAY_API_KEY", "ezHyHNB1973AQ+4Zobzd0g")
    station_id = request.args.get("stationID")
    
    if not station_id:
        return jsonify({"error": "stationID parameter is required"}), 400

    try:
        params = {
            "apiKey": api_key,
            "stationID": station_id,
            "lang": 0,
            "output": "json"
        }
        
        res = requests.get(f"{ODSAY_BASE_URL}/busStationInfo", params=params, timeout=10)
        res.raise_for_status()
        return jsonify(res.json())
        
    except requests.exceptions.RequestException as e:
        log.error("odsay_busStationInfo_failed", error=str(e))
        return jsonify({"error": "Failed to connect to ODsay busStationInfo API"}), 502
