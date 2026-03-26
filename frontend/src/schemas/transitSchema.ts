import { z } from "zod";

export const TransitStepSchema = z.object({
  type: z.number(), // 1:지하철, 2:버스, 3:도보
  distance: z.number().optional(),
  sectionTime: z.number().optional(),
  path: z.array(z.object({ lat: z.number(), lng: z.number() })).optional(),
  isLowFloor: z.boolean().optional(),
  busNo: z.string().optional(),
  startName: z.string().optional(),
  endName: z.string().optional(),
});

export const TransitResponseSchema = z.object({
  status: z.string(),
  totalTime: z.number(),
  totalDistance: z.number(),
  steps: z.array(TransitStepSchema),
});

export type TransitResponse = z.infer<typeof TransitResponseSchema>;
