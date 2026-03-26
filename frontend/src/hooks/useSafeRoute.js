import { useMutation } from '@tanstack/react-query';
// 수정: 우리가 맞춘 스토어 이름인 useUIStore로 가져옵니다.
import useUIStore from '../store/useUIStore';

import api from '../lib/api';

export const useSafeRoute = () => {
  const setWheelchairInfo = useUIStore((state) => state.setWheelchairInfo);
  const setMapCenter = useUIStore((state) => state.setMapCenter);

  return useMutation({
    mutationFn: async ({ start, end }) => {
      const res = await api.post('/api/route', { start, end });
      return res.data;
    },

    // 2. 통신 성공 시 실행될 로직
    onSuccess: (data) => {
      // 휠체어 전용 경로 저장
      setWheelchairInfo(data);

      // 검색 결과의 첫 번째 지점으로 지도의 중심을 이동시킵니다.
      if (data.path && data.path.length > 0) {
        setMapCenter(data.path[0]);
      }

      console.log("경로 탐색 성공:", data);
    },

    // 3. 통신 실패 시 실행될 로직
    onError: (error) => {
      console.error("경로 탐색 에러:", error.message);
      alert("경로를 찾을 수 없습니다. 주소를 다시 확인해주세요.");
    },
  });
};
