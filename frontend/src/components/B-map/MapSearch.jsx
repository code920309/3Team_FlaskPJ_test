import React, { useState } from 'react';
import { Navigation } from 'lucide-react';
import useUIStore from '../../store/useUIStore';
import { useSafeRoute } from '../../hooks/useSafeRoute';

export default function MapSearch() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [isKakaoSearching, setIsKakaoSearching] = useState(false); // 카카오 검색 로딩 상태

  // Zustand 스토어에서 마커를 그리기 위한 좌표 저장 함수 가져오기
  const setRoutePoints = useUIStore((state) => state.setRoutePoints);

  // 백엔드 경로 탐색 통신 훅
  const { mutate: fetchSafeRoute, isPending: isRoutePending } = useSafeRoute();

  /**
   * 카카오 로컬 API 장소 검색 (텍스트 -> 좌표 변환)
   * PRD V3.0: VITE_ 접두사가 붙은 키를 사용하여 프론트에서 직접 호출
   */
  const getCoordinatesFromKakao = async (keyword) => {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${import.meta.env.VITE_KAKAO_APP_KEY}`,
      },
    });

    if (!response.ok) throw new Error('카카오 API 검색에 실패했습니다.');

    const data = await response.json();
    if (data.documents.length === 0) {
      throw new Error(`"${keyword}"에 대한 검색 결과가 없습니다.`);
    }

    // 최상단 검색 결과 1개의 좌표 반환
    const place = data.documents[0];
    return {
      name: place.place_name,
      lat: place.y, // 카카오 API 응답 기준 y가 위도
      lng: place.x, // 카카오 API 응답 기준 x가 경도
    };
  };

  /**
   * 폼 제출 핸들러
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!start.trim() || !end.trim()) return alert("출발지와 도착지를 모두 입력해주세요!");

    setIsKakaoSearching(true);
    try {
      // 1. 입력된 텍스트를 위경도 좌표로 변환
      const startPoint = await getCoordinatesFromKakao(start);
      const endPoint = await getCoordinatesFromKakao(end);

      // 2. SafeMap 컴포넌트에서 출발/도착 마커를 그릴 수 있도록 상태 창고에 저장
      setRoutePoints({ start: startPoint, end: endPoint });

      // 3. 변환된 좌표를 사용해 백엔드로 Tmap 경로 탐색 요청
      fetchSafeRoute({ start: startPoint, end: endPoint });

    } catch (error) {
      alert(error.message);
    } finally {
      setIsKakaoSearching(false);
    }
  };

  // 렌더링 중인 총 로딩 상태 (카카오 좌표 검색 + 백엔드 경로 탐색)
  const isTotalLoading = isKakaoSearching || isRoutePending;

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md px-4">
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl shadow-2xl p-4 border border-gray-100 flex flex-col gap-3"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="출발지 입력 (예: 수원역)"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            // PRD V3.0 (WCAG 2.2 AA): min-h-[44px] 추가
            className="w-full pl-4 pr-4 py-2 min-h-[44px] bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder="도착지 입력 (예: 화성행궁)"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            // PRD V3.0 (WCAG 2.2 AA): min-h-[44px] 추가
            className="w-full pl-4 pr-4 py-2 min-h-[44px] bg-gray-50 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isTotalLoading}
          // PRD V3.0 (WCAG 2.2 AA): min-h-[44px] 추가
          className={`w-full py-3 min-h-[44px] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            isTotalLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-black'
          }`}
        >
          <Navigation size={16} />
          {isTotalLoading ? '안전 경로 탐색 중...' : '안전 경로 검색'}
        </button>
      </form>
    </div>
  );
}
