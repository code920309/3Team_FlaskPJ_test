import React, { useState } from 'react';
import { CustomOverlayMap } from 'react-kakao-maps-sdk';
import { AlertTriangle, Clock, X, Info, Camera } from 'lucide-react';

/**
 * DangerMarker
 * 지도에 실시간 위험 요소를 표시하는 커스텀 오버레이 컴포넌트 (PRD 5.1)
 * 위험도(severity)에 따라 색상이 동적으로 변합니다.
 */
export default function DangerMarker({ marker, onRemove }) {
  const [isOpen, setIsOpen] = useState(false);

  // 위험 유형 한글 변환 루틴
  const getTypeText = (type) => {
    const types = {
      stairs: '계단/장벽',
      construction: '공사/폐쇄',
      steep_slope: '가파른 경사',
      elevator_broken: '엘리베이터 고장'
    };
    return types[type] || '기타 위험';
  };

  // 등급별 강렬한 경고 색상 선정
  const getSeverityColor = (severity) => {
    if (severity >= 5) return 'text-red-600 bg-red-100 border-red-500 shadow-red-200';
    if (severity >= 3) return 'text-orange-600 bg-orange-100 border-orange-400 shadow-orange-200';
    return 'text-yellow-600 bg-yellow-100 border-yellow-400 shadow-yellow-200';
  };

  const severityStyles = getSeverityColor(marker.severity);
  const [colorText, bgColor, borderColor, shadowColor] = severityStyles.split(' ');

  return (
    <CustomOverlayMap 
      position={{ lat: marker.location.coordinates[1], lng: marker.location.coordinates[0] }} 
      zIndex={100}
    >
      <div className="relative group animate-bounce-subtle">
        {/* 마커 본체 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shadow-lg transition-all transform active:scale-90 ${bgColor} ${borderColor} ${shadowColor} hover:scale-110`}
        >
          <AlertTriangle className={colorText} size={20} fill="currentColor" />
        </button>

        {/* 30분 자동 폭발 UI 장치 효과 (선택적 시각 효과) */}
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping pointer-events-none opacity-50" />

        {/* 툴팁/상세 카드 (PRD 5.1) */}
        {isOpen && (
          <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 w-56 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/30 overflow-hidden animate-in zoom-in slide-in-from-bottom-2 duration-300">
            <div className={`h-1.5 w-full ${bgColor.replace('100', '500')}`} />
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-gray-900 leading-tight">
                    {getTypeText(marker.type)}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                    LEVEL {marker.severity} DANGER
                  </p>
                </div>
                <button 
                  onClick={() => onRemove(marker.id)}
                  className="p-1 hover:bg-gray-100 rounded-md text-gray-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              {/* 이미지 미리보기 (있는 경우) */}
              {marker.image_url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 shadow-sm aspect-video">
                  <img src={marker.image_url} alt="위험 현장" className="w-full h-full object-cover" />
                </div>
              )}

              {/* 상세 설명 */}
              {marker.description && (
                  <p className="text-xs text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50 leading-relaxed italic">
                      "{marker.description}"
                  </p>
              )}

              {/* 하단 정보 */}
              <div className="flex items-center justify-between text-[10px] pt-1">
                <div className="flex items-center gap-1 text-blue-500 font-bold">
                  <Clock size={10} />
                  <span>실시간 신고</span>
                </div>
                <span className="text-gray-400 font-medium">제거됨: 30분 후</span>
              </div>
            </div>
            
            {/* 꼬리표 */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-r border-b border-gray-200" />
          </div>
        )}
      </div>
    </CustomOverlayMap>
  );
}
