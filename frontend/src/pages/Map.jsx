import React, { useEffect, useState } from 'react';
import { Map, MapMarker, MarkerClusterer, Polyline, ZoomControl, useKakaoLoader, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { ShieldAlert, Loader2, X, Info } from 'lucide-react';

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
    const [selectedElevator, setSelectedElevator] = useState(null);

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

    // 3. 통합 경로 시각화 (휠체어/대중교통 하이브리드 대응)
    const linePath = React.useMemo(() => {
        if (!routeInfo) return [];
        const path = [];

        // CASE 1: 대중교통 데이터 (steps 기반)
        if (routeInfo.steps) {
            routeInfo.steps.forEach(step => {
                if (step.path && Array.isArray(step.path)) {
                    step.path.forEach(coord => {
                        path.push({ lat: coord.lat, lng: coord.lng });
                    });
                }
            });
            return path;
        }

        // CASE 2: Tmap 휠체어 전용 데이터 (features 기반)
        if (routeInfo.features) {
            routeInfo.features.forEach(feature => {
                if (feature.geometry.type === "LineString") {
                    feature.geometry.coordinates.forEach(coord => {
                        path.push({ lat: coord[1], lng: coord[0] });
                    });
                }
            });
            return path;
        }

        return [];
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
            <MapSearch />

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

            <Map
                center={center}
                className="w-full h-full"
                level={3}
                onIdle={(map) => {
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

                {/* 엘리베이터 마커 (PRD 3.2: 이미지 깨짐 방지를 위한 텍스트 오버레이 마커) */}
                {elevatorsData?.elevators?.map((e, i) => {
                    const isNormal = e.status === '정상' || e.status === 'normal';
                    return (
                        <React.Fragment key={`ev-group-${i}`}>
                            <CustomOverlayMap position={{ lat: e.coordinates[0], lng: e.coordinates[1] }}>
                                <div
                                    onClick={() => setSelectedElevator(e)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-xl cursor-pointer transition-transform hover:scale-110 active:scale-95 ${isNormal ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                >
                                    <span className="text-[10px] font-bold text-white leading-none">
                                        {isNormal ? '정상' : '점검'}
                                    </span>
                                </div>
                            </CustomOverlayMap>

                            {/* 상세 정보 팝업 (클릭 시 노출) */}
                            {selectedElevator?.id === e.id && (
                                <CustomOverlayMap position={{ lat: e.coordinates[0], lng: e.coordinates[1] }} yAnchor={1.6}>
                                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[210px] animate-in zoom-in-95 duration-200 z-[1002]">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">{e.station_name}역</h4>
                                                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{e.line}</span>
                                            </div>
                                            <button onClick={() => setSelectedElevator(null)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                                <X size={14} className="text-gray-400" />
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-start gap-2 text-[11px] text-gray-600 leading-tight">
                                                <Info size={12} className="mt-0.5 flex-shrink-0" />
                                                <span>{e.location}</span>
                                            </div>
                                            <div className={`text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${isNormal ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                <div className={`w-1.5 h-1.5 rounded-full ${isNormal ? 'bg-green-500' : 'bg-red-500'}`} />
                                                상태: {e.status}
                                            </div>
                                        </div>
                                        <div className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45 border-r border-b border-gray-100"></div>
                                    </div>
                                </CustomOverlayMap>
                            )}
                        </React.Fragment>
                    );
                })}

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
