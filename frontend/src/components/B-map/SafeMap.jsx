import React from 'react';
// PRD V3.0: Kakao Maps SDK 사용 및 MarkerClusterer 기본 적용
import { Map, Polyline, MapMarker, MarkerClusterer } from 'react-kakao-maps-sdk';
import useUIStore from '../../store/useUIStore';

export default function SafeMap() {
  // 상태 창고(useUIStore)에서 데이터 가져오기
  const mapCenter = useUIStore((state) => state.mapCenter);
  const routeInfo = useUIStore((state) => state.routeInfo);
  const routePoints = useUIStore((state) => state.routePoints); // MapSearch에서 저장한 출발/도착 좌표

  // 중심 좌표가 없을 경우의 기본값 (수원역 기준)
  const defaultCenter = mapCenter || { lat: 37.266, lng: 126.999 };

  return (
    <div className="w-full h-full relative">
      <Map
        center={defaultCenter}
        level={4} // 카카오맵 기본 줌 레벨 (1~14, 숫자가 작을수록 확대)
        className="w-full h-full z-0"
        isPanto={true} // 부드러운 중심 이동 애니메이션 (Leaflet의 MapController 역할 대체)
      >
        {/* 1. 휠체어 안전 경로 폴리라인 렌더링 */}
        {routeInfo?.path && routeInfo.path.length > 0 && (
          <Polyline
            path={routeInfo.path}
            strokeWeight={6}
            strokeColor="#3b82f6"
            strokeOpacity={0.8}
            strokeStyle="solid"
          />
        )}

        {/* 2. 출발지 및 도착지 마커 렌더링 (PRD Section 4: MarkerClustering 사용) */}
        <MarkerClusterer averageCenter={true} minLevel={10}>
          {routePoints?.start && (
            <MapMarker
              position={routePoints.start}
              title="출발지"
              // 접근성 향상을 위한 마커 정보 (필요시 커스텀 이미지로 교체 가능)
            />
          )}

          {routePoints?.end && (
            <MapMarker
              position={routePoints.end}
              title="도착지"
            />
          )}
        </MarkerClusterer>
      </Map>
    </div>
  );
}
