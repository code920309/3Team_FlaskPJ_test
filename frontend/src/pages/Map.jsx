import React, { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, Polyline, ZoomControl, useKakaoLoader } from 'react-kakao-maps-sdk';
import { ShieldAlert, Loader2 } from 'lucide-react';

import useUIStore from '../store/useUIStore';
import useMapStore from '../store/useMapStore';

import MapSearch from '../components/B-map/MapSearch';
import ReportModal from '../components/F-sse/ReportModal';
import DangerMarker from '../components/F-sse/DangerMarker';

import { usePlaces } from '../hooks/usePlaces';
import { useElevators } from '../hooks/useElevators';
import { useReportsRealtime } from '../hooks/useReportsRealtime';
import api from '../lib/api';

const MapPage = () => {
    // 1. 카카오 지도 SDK 로드 (PRD 4.2 안정성 확보)
    const [loading] = useKakaoLoader({
        appkey: import.meta.env.VITE_KAKAO_APP_KEY,
        libraries: ["services", "clusterer"],
    });

    const [center, setCenter] = useState({ lat: 37.2635727, lng: 127.0287149 });
    
    // Zustand Stores
    const routeInfo = useUIStore((state) => state.routeInfo);
    const { isReportModalOpen, openReportModal, closeReportModal } = useUIStore();
    const { dangerMarkers, setDangerMarkers, cleanupOldMarkers, removeDangerMarker } = useMapStore();

    // Data Hooks
    const { data: placesData } = usePlaces(center.lat, center.lng);
    const { data: elevatorsData } = useElevators();
    useReportsRealtime();

    // 2. 초기 신고 데이터 페칭 및 자동 소멸 타이머
    useEffect(() => {
        if (loading) return;

        const fetchInitialReports = async () => {
            try {
                const { data } = await api.get('/api/reports');
                if (data.reports) setDangerMarkers(data.reports);
            } catch (err) {
                console.error("Failed to fetch reports:", err);
            }
        };
        fetchInitialReports();

        // 1분마다 오래된 마커 청소 (PRD 3.4)
        const timer = setInterval(() => {
            cleanupOldMarkers();
        }, 60000);

        return () => clearInterval(timer);
    }, [loading, setDangerMarkers, cleanupOldMarkers]);

    // 3. 경로 시각화 (Polyline용 좌표 변환)
    const linePath = React.useMemo(() => {
        if (!routeInfo || !routeInfo.features) return [];
        const path = [];
        routeInfo.features.forEach(feature => {
            if (feature.geometry.type === "LineString") {
                feature.geometry.coordinates.forEach(coord => {
                    path.push({ lat: coord[1], lng: coord[0] });
                });
            }
        });
        return path;
    }, [routeInfo]);

    if (loading) {
        return (
            <div className="w-full h-screen bg-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="font-bold text-gray-600">회장님, 수원시 정밀 지도를 불러오고 있습니다...</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-gray-100 overflow-hidden">
            {/* 1. 상단 검색창 컴포넌트 */}
            <MapSearch />

            {/* 2. 실시간 위험 신고 버튼 (PRD 3.1) */}
            <button
                onClick={openReportModal}
                className="absolute bottom-10 right-6 z-[1000] flex items-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 font-bold group"
            >
                <ShieldAlert size={20} className="group-hover:animate-pulse" />
                <span>위험 신고</span>
                <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-white/20 rounded-full text-[10px]">
                    {dangerMarkers.length}
                </div>
            </button>

            {/* 3. 메인 지도 영역 */}
            <Map
                center={center}
                className="w-full h-full"
                level={3}
                onCenterChanged={(map) => {
                    const latlng = map.getCenter();
                    setCenter({ lat: latlng.getLat(), lng: latlng.getLng() });
                }}
            >
                <ZoomControl position="RIGHT" />

                {/* 경로 시각화 */}
                {linePath.length > 0 && (
                    <Polyline
                        path={linePath}
                        strokeWeight={6}
                        strokeColor="#3b82f6"
                        strokeOpacity={0.8}
                        strokeStyle="solid"
                    />
                )}

                {/* 배리어프리 베뉴 (클러스터러) */}
                <MarkerClusterer averageCenter={true} minLevel={5}>
                    {placesData?.features?.map((f, i) => (
                        <MapMarker
                            key={`place-${i}`}
                            position={{ lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] }}
                            title={f.properties.name}
                        />
                    ))}
                </MarkerClusterer>

                {/* 엘리베이터 마커 */}
                {elevatorsData?.elevators?.map((e, i) => (
                    <MapMarker
                        key={`ev-${i}`}
                        position={{ lat: e.coordinates[1], lng: e.coordinates[0] }}
                        title={`${e.name} (${e.status})`}
                        image={{
                            src: "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
                            size: { width: 24, height: 35 }
                        }}
                    />
                ))}

                {/* 실시간 위험 신고 마커 (F5 엔진 핵심) */}
                {dangerMarkers.map((m) => (
                    <DangerMarker 
                        key={m.id} 
                        marker={m} 
                        onRemove={removeDangerMarker} 
                    />
                ))}
            </Map>

            {/* 4. 신고 모달 (PRD 3.1) */}
            <ReportModal 
                isOpen={isReportModalOpen} 
                onClose={closeReportModal} 
                lat={center.lat}
                lng={center.lng}
            />
        </div>
    );
};

export default MapPage;
