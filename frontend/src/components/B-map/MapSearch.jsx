import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, MapPin, Flag, Clock, Ruler, Bus, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import { useSafeRoute } from '../../hooks/useSafeRoute';
import { useTransit } from '../../hooks/useTransit';

export default function MapSearch() {
  const navigate = useNavigate();
  const [start, setStart] = useState('수원시청');
  const [end, setEnd] = useState('수원역');
  const [selectedMode, setSelectedMode] = useState('wheelchair');
  const [isCollapsed, setIsCollapsed] = useState(false); // 접기 상태 추가

  // 스토어 상태
  const { wheelchairInfo, transitInfo, setRouteInfo } = useUIStore();
  
  // 훅 초기화
  const wheelchairMutation = useSafeRoute();
  const transitMutation = useTransit();
  const isPending = wheelchairMutation.isPending || transitMutation.isPending;

  // 1. 휠체어 경로 요약 계산
  const wheelchairSummary = useMemo(() => {
    if (!wheelchairInfo || !wheelchairInfo.features || wheelchairInfo.features.length === 0) return null;
    const props = wheelchairInfo.features[0].properties;
    return {
      time: Math.floor(props.totalTime / 60),
      distance: (props.totalDistance / 1000).toFixed(1),
    };
  }, [wheelchairInfo]);

  // 2. 대중교통 경로 요약 계산
  const transitSummary = useMemo(() => {
    if (!transitInfo) return null;
    return {
      time: transitInfo.totalTime,
      distance: (transitInfo.totalDistance / 1000).toFixed(1),
    };
  }, [transitInfo]);

  const searchCoord = (text) => {
    return new Promise((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      const ps = new window.kakao.maps.services.Places();
      geocoder.addressSearch(text, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          resolve({ lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) });
        } else {
          ps.keywordSearch(text, (data, psStatus) => {
            if (psStatus === window.kakao.maps.services.Status.OK) {
              resolve({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
            } else {
              reject(new Error(`'${text}' 장소를 찾을 수 없습니다.`));
            }
          });
        }
      });
    });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!start || !end) return alert("출발지와 도착지를 모두 입력해주세요!");
    if (!window.kakao?.maps?.services) return alert("지도 서비스 준비 중...");

    try {
      const startCoord = await searchCoord(start);
      const endCoord = await searchCoord(end);
      
      wheelchairMutation.mutate({ start: startCoord, end: endCoord });
      transitMutation.mutate({ 
        startX: startCoord.lng, startY: startCoord.lat, 
        endX: endCoord.lng, endY: endCoord.lat 
      });
      
      setSelectedMode('wheelchair');
    } catch (err) {
      alert(err.message);
    }
  };

  const selectMode = (mode) => {
    setSelectedMode(mode);
    if (mode === 'wheelchair' && wheelchairInfo) setRouteInfo(wheelchairInfo);
    if (mode === 'transit' && transitInfo) setRouteInfo(transitInfo);
  };

  return (
    <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-4 transition-all duration-500 ease-in-out">
      {/* 상단 컨트롤 바 (뒤로가기 & 접기) */}
      <div className="flex gap-2">
        <button 
          onClick={() => navigate('/')}
          className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all border border-white/20"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-white/20"
        >
          {isCollapsed ? <ChevronDown size={20} strokeWidth={2.5} /> : <ChevronUp size={20} strokeWidth={2.5} />}
        </button>
      </div>

      {/* 검색 패널 (접기 상태 반영: 즉시 숨김) */}
      <div className={`flex flex-col gap-4 w-full max-w-md ${isCollapsed ? 'hidden' : 'block'}`}>
        <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-white/20">
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><MapPin size={18} /></div>
              <input type="text" placeholder="출발지" value={start} onChange={(e) => setStart(e.target.value)} className="flex-1 h-11 px-4 bg-gray-50 rounded-xl text-sm" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center text-red-600"><Flag size={18} /></div>
              <input type="text" placeholder="도착지" value={end} onChange={(e) => setEnd(e.target.value)} className="flex-1 h-11 px-4 bg-gray-50 rounded-xl text-sm" />
            </div>
          </div>
          <button type="submit" disabled={isPending} className="w-full h-14 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg">
            {isPending ? '계산 중...' : '안전 경로 검색'}
          </button>
        </form>

        {(wheelchairSummary || transitSummary) && (
          <div className="bg-white/95 backdrop-blur-8 rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            <div className="grid grid-cols-2 p-2 gap-2 bg-gray-50">
              <button 
                onClick={() => selectMode('wheelchair')}
                className={`p-4 rounded-2xl transition-all text-left ${selectedMode === 'wheelchair' ? 'bg-blue-600 shadow-lg text-white' : 'bg-white border-gray-100 border text-gray-900'}`}
              >
                <p className={`text-[10px] font-bold uppercase mb-1 ${selectedMode === 'wheelchair' ? 'text-blue-100' : 'text-blue-600'}`}>휠체어 소요시간</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{wheelchairSummary?.time || '--'}</span>
                  <span className="text-xs font-bold opacity-70">분</span>
                  {wheelchairSummary && (
                    <span className={`ml-auto text-xs font-bold ${selectedMode === 'wheelchair' ? 'text-white' : 'text-blue-600'}`}>
                      {wheelchairSummary.distance}km
                    </span>
                  )}
                </div>
              </button>
              <button 
                onClick={() => selectMode('transit')}
                className={`p-4 rounded-2xl transition-all text-left ${selectedMode === 'transit' ? 'bg-indigo-600 shadow-lg text-white' : 'bg-white border-gray-100 border text-gray-900'}`}
              >
                <p className={`text-[10px] font-bold uppercase mb-1 ${selectedMode === 'transit' ? 'text-indigo-100' : 'text-indigo-600'}`}>저상버스 소요시간</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">{transitSummary?.time || '--'}</span>
                  <span className="text-xs font-bold opacity-70">분</span>
                  {transitSummary && (
                    <span className={`ml-auto text-xs font-bold ${selectedMode === 'transit' ? 'text-white' : 'text-indigo-600'}`}>
                      {transitSummary.distance}km
                    </span>
                  )}
                </div>
              </button>
            </div>

            <div className="p-6">
              {selectedMode === 'wheelchair' ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Clock size={16} />
                    <span className="text-sm font-bold">휠체어 전문 도보 경로</span>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-2xl text-blue-700 text-xs font-medium leading-relaxed border border-blue-100">
                    "계단과 가파른 경사를 피하여 휠체어 사용자가 이동할 수 있는 경로입니다."
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Bus size={16} />
                    <span className="text-sm font-bold">저상버스 노선 정보</span>
                  </div>
                  <div className="space-y-2">
                    {transitInfo?.steps.filter(s => s.type === 2).map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <span className="text-xs font-bold text-indigo-900">{s.busNo}번</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.isLowFloor ? 'bg-indigo-600 text-white' : 'bg-gray-300 text-white'}`}>
                          {s.isLowFloor ? '저상버스' : '일반'}
                        </span>
                      </div>
                    ))}
                    <p className="text-[10px] text-gray-400 text-center mt-2 font-medium">* 위 시간은 대중교통 평균 고정값 기준입니다.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
