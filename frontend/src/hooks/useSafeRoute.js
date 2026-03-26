import { useMutation } from '@tanstack/react-query';
import useUIStore from '../store/useUIStore';

export const useSafeRoute = () => {
  const setRouteInfo = useUIStore((state) => state.setRouteInfo);
  const setMapCenter = useUIStore((state) => state.setMapCenter);

  return useMutation({
    // 1. 실제 백엔드와 통신하는 함수
    mutationFn: async ({ start, end }) => {
      // API 주소를 백엔드 Blueprint 라우팅에 맞게 수정 (/api/route/calculate 가정)
      const response = await fetch('/api/route/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start_place: start,
          end_place: end,
        }),
      });

      if (!response.ok) {
        throw new Error('경로를 불러오는 데 실패했습니다.');
      }

      const result = await response.json();

      // 백엔드 에러 처리
      if (result.error) {
        throw new Error(result.error);
      }

      // 백엔드에서 넘겨준 원본 Tmap 데이터 반환
      return result.data.route_data;
    },

    // 2. 통신 성공 시 실행될 로직 (데이터 정제 및 변환)
    onSuccess: (tmapData) => {
      const features = tmapData.features || [];
      let totalTime = 0;
      let totalDistance = 0;
      const kakaoPath = [];

      features.forEach((feature, index) => {
        // 첫 번째 feature의 properties에서 총 소요시간/거리 추출
        if (index === 0 && feature.properties) {
          totalTime = feature.properties.totalTime || 0; // 초 단위
          totalDistance = feature.properties.totalDistance || 0; // 미터 단위
        }

        const geometry = feature.geometry;

        // 카카오맵 폴리라인 렌더링을 위한 좌표 변환
        if (geometry.type === 'LineString') {
          geometry.coordinates.forEach((coord) => {
            // Tmap [lng, lat] 형식을 Kakao { lat, lng } 객체로 변환
            kakaoPath.push({ lat: coord[1], lng: coord[0] });
          });
        } else if (geometry.type === 'Point') {
           // 분기점 등의 Point 좌표
           kakaoPath.push({ lat: geometry.coordinates[1], lng: geometry.coordinates[0] });
        }
      });

      // 정제된 최종 데이터를 객체로 구성
      const routeResult = {
        path: kakaoPath,
        totalTime: Math.ceil(totalTime / 60), // 초 -> 분 단위로 변환
        totalDistance: totalDistance,
      };

      // 변환 완료된 데이터를 스토어에 저장
      setRouteInfo(routeResult);

      // 검색 결과의 첫 번째 지점으로 지도의 중심을 이동
      if (kakaoPath.length > 0) {
        setMapCenter(kakaoPath[0]);
      }

      console.log("휠체어 경로 탐색 및 변환 성공:", routeResult);
    },

    // 3. 통신 실패 시 실행될 로직
    onError: (error) => {
      console.error("경로 탐색 에러:", error.message);
      alert("경로를 찾을 수 없습니다. 주소를 다시 확인해주세요.");
    },
  });
};
