import { create } from 'zustand';

/**
 * useMapStore
 * 실시간 위험 마커(dangerMarkers) 상태를 관리합니다. (PRD 5.1, 9.2)
 * 30분 자동 소멸 로직이 포함되어 있습니다.
 */
const useMapStore = create((set) => ({
  dangerMarkers: [],

  /**
   * 새로운 마커 추가
   * @param {Object} report 신규 신고 데이터
   */
  addDangerMarker: (report) => set((state) => {
    // 중복 제거 (ID 기준)
    if (state.dangerMarkers.some(m => m.id === report.id)) return state;

    const newMarker = {
      ...report,
      // created_at이 문자열로 올 경우 Date 객체로 변환
      timestamp: new Date(report.created_at || Date.now()).getTime(),
    };

    return {
      dangerMarkers: [...state.dangerMarkers, newMarker]
    };
  }),

  /**
   * 마커 수동 제거
   */
  removeDangerMarker: (id) => set((state) => ({
    dangerMarkers: state.dangerMarkers.filter(m => m.id !== id)
  })),

  /**
   * 30분 자동 소멸 필터링 (PRD 3.4)
   * 정기적으로 호출하여 오래된 마커를 제거합니다.
   */
  cleanupOldMarkers: () => set((state) => {
    const THIRTY_MINUTES = 30 * 60 * 1000;
    const now = Date.now();
    
    return {
      dangerMarkers: state.dangerMarkers.filter(m => (now - m.timestamp) < THIRTY_MINUTES)
    };
  }),

  setDangerMarkers: (markers) => set({ 
    dangerMarkers: markers.map(m => ({
      ...m,
      timestamp: new Date(m.created_at).getTime()
    }))
  }),
}));

export default useMapStore;
