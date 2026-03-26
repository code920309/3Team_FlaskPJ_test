import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import useMapStore from "../store/useMapStore";

/**
 * useReportsRealtime Hook
 * Supabase Realtime(WebSocket)을 통해 실시간으로 신고 데이터를 갱신합니다. (PRD 9.3)
 */
export function useReportsRealtime() {
  const queryClient = useQueryClient();
  const addDangerMarker = useMapStore((state) => state.addDangerMarker);

  useEffect(() => {
    // 1. WebSocket 구독 설정
    // reports 테이블의 INSERT 이벤트를 감시
    const channel = supabase
      .channel("reports-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          console.log("New report received:", payload);
          // (1) TanStack Query 캐시를 무효화하여 자동 리프레시 유도
          queryClient.invalidateQueries({ queryKey: ["reports"] });
          // (2) PRD 9.1: Zustand 스토어에 즉시 마커 추가 (API 지연 없음)
          addDangerMarker(payload.new);
        }
      )
      .subscribe();

    // cleanup: 컴포넌트 언마운트 시 채널 연결 해제 
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, addDangerMarker]);
}
