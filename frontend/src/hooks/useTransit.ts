import { useMutation } from "@tanstack/react-query";
import api from "../lib/api";
import { TransitResponseSchema } from "../schemas/transitSchema";
import useUIStore from "../store/useUIStore";

export interface TransitRequest {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const useTransit = () => {
  const setTransitInfo = useUIStore((state: any) => state.setTransitInfo);

  return useMutation({
    mutationFn: async (req: TransitRequest) => {
      const { data } = await api.post("/api/transit", req);
      // Zod로 데이터 타입 검증 (PRD v3.0 규정 준수)
      return TransitResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      setTransitInfo(data);
      console.log("Integrated Transit Success:", data);
    },
    onError: (error) => {
      console.error("Integrated Transit Search Failed:", error);
    }
  });
};
