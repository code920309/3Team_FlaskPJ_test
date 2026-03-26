import { create } from 'zustand';

/**
 * useUIStore (Zustand)
 * UI 전용 상태 관리 (PRD 9.2 준수)
 */
const useUIStore = create((set) => ({
  // 1. 경로 정보 상태
  startPoint: null,
  endPoint: null,
  mapCenter: { lat: 37.2664, lng: 127.0002 },
  routeInfo: null,
  wheelchairInfo: null,
  transitInfo: null,

  setStartPoint: (point) => set({ startPoint: point }),
  setEndPoint: (point) => set({ endPoint: point }),
  setMapCenter: (center) => set({ mapCenter: center }),
  setRouteInfo: (info) => set({ routeInfo: info }),
  setWheelchairInfo: (info) => set({ wheelchairInfo: info }),
  setTransitInfo: (info) => set({ transitInfo: info }),

  // 2. 모달 상태 (신고하기)
  isReportModalOpen: false,
  openReportModal: () => set({ isReportModalOpen: true }),
  closeReportModal: () => set({ isReportModalOpen: false }),

  // 3. 로딩 및 에러
  isLoading: false,
  error: null,
  setIsLoading: (bool) => set({ isLoading: bool }),
  setError: (err) => set({ error: err }),

  // 4. 실시간 위험 마커 (임시 상태 관리용)
  dangerMarkers: [],
  addDangerMarker: (marker) =>
    set((state) => {
      const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
      const fresh = state.dangerMarkers.filter(
        (m) => new Date(m.created_at).getTime() > thirtyMinutesAgo
      );
      return { dangerMarkers: [...fresh, { ...marker, _addedAt: Date.now() }] };
    }),
  removeDangerMarker: (id) =>
    set((state) => ({
      dangerMarkers: state.dangerMarkers.filter((m) => m.id !== id),
    })),
  clearDangerMarkers: () => set({ dangerMarkers: [] }),
}));

export default useUIStore;
