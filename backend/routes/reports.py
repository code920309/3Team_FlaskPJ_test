import os
import uuid
import mimetypes
import traceback
from flask import Blueprint, request, jsonify
from middleware.auth import require_auth, supabase
from db import engine
from sqlalchemy import text
import json

reports_bp = Blueprint("reports", __name__)

@reports_bp.route("/api/reports", methods=["GET"])
def get_reports():
    """최근 위험 신고 내역을 반환"""
    try:
        query = text("""
            SELECT id, user_id, ST_AsGeoJSON(location) as location, type, severity, description, image_url, created_at
            FROM reports
            ORDER BY created_at DESC
            LIMIT 50
        """)
        
        with engine.connect() as conn:
            result = conn.execute(query)
            reports = []
            for row in result:
                reports.append({
                    "id": str(row.id),
                    "user_id": str(row.user_id) if row.user_id else None,
                    "location": json.loads(row.location),
                    "type": row.type,
                    "severity": row.severity,
                    "description": row.description,
                    "image_url": row.image_url,
                    "created_at": row.created_at.isoformat()
                })
        return jsonify({"reports": reports})
    except Exception as e:
        traceback.print_exc() # 상세 에러 로그 기록
        return jsonify({"error": f"DB 조회 실패: {str(e)}"}), 500

@reports_bp.route("/api/report", methods=["POST"])
def create_report():
    try:
        # 로그인 정보 파싱 (없을 수 있음)
        user_id = None
        if hasattr(request, 'user') and request.user and hasattr(request.user, 'user'):
            user_id = request.user.user.id
        
        type_ = request.form.get("type")
        severity = request.form.get("severity", 3)
        description = request.form.get("description", "")
        lat = request.form.get("latitude")
        lng = request.form.get("longitude")

        if not type_ or not lat or not lng:
            return jsonify({"error": "필수 항목(유형, 좌표)이 누락되었습니다."}), 400

        image_url = None
        file = request.files.get("image")
        
        # 1. 사진 업로드 처리 (Supabase Storage)
        if file and file.filename:
            if not supabase:
                return jsonify({"error": "서버의 Supabase 설정(URL/Key)을 확인해 주세요."}), 500
            
            try:
                # 버킷 이름: reports-images
                bucket_name = "reports-images"
                filename = f"{uuid.uuid4()}_{file.filename}"
                
                # 업로드 (기존 파일 있을 시 중복 방지 위해 UUID 사용)
                file_data = file.read()
                mime_type = mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
                
                res = supabase.storage.from_(bucket_name).upload(
                    path=filename,
                    file=file_data,
                    file_options={"content-type": mime_type}
                )
                
                # 2. 공개 URL 획득
                url_res = supabase.storage.from_(bucket_name).get_public_url(filename)
                # v2.x 에서는 문자열이 바로 오거나 객체 내 public_url 속성이 있음
                if isinstance(url_res, str):
                    image_url = url_res
                elif hasattr(url_res, 'public_url'):
                    image_url = url_res.public_url
                else:
                    image_url = str(url_res)

            except Exception as storage_err:
                traceback.print_exc()
                return jsonify({"error": f"사진 업로드 실패: {str(storage_err)}. 'reports-images' 버킷이 생성되어 있는지 확인해 주세요."}), 500

        # 사진 필수 체크 (프론트에서도 하지만 백엔드에서도 한번 더 안전하게)
        if not image_url:
            return jsonify({"error": "현장 사진 업로드가 필요합니다."}), 400

        # user_id 유무에 따른 동적 쿼리 생성 (FK 제약 에러 방지)
        sql_cols = ["location", "type", "severity", "description", "image_url"]
        sql_vals = ["ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)", ":type", ":severity", ":description", ":image_url"]
        params = {"lng": float(lng), "lat": float(lat), "type": type_, "severity": int(severity), "description": description, "image_url": image_url}

        if user_id:
            sql_cols.append("user_id")
            sql_vals.append(":user_id")
            params["user_id"] = user_id

        query = text(f"INSERT INTO reports ({', '.join(sql_cols)}) VALUES ({', '.join(sql_vals)}) RETURNING id")

        with engine.connect() as conn:
            result = conn.execute(query, params)
            conn.commit()
            new_id = result.fetchone()[0]

        return jsonify({"status": "success", "id": str(new_id)})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"서버 오류: {str(e)}"}), 500
