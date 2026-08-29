// frontend/src/lib/api/heatmap.ts
//
// Investor Global Heatmap geo signal — BACKEND /api/domain/investor/heatmap.

import { domainGet } from "@/lib/domainApi";

export interface RegionSignal {
  name: string;
  avgReadiness: number;
  complianceRate: number;
  color: string;
}
export interface SectorSignal {
  sector: string;
  avgGrowth: number;
}
export interface HeatmapSignal {
  regions: RegionSignal[];
  sectors: SectorSignal[];
}

export const EMPTY_HEATMAP: HeatmapSignal = {
  regions: [],
  sectors: [],
};

/** GET /api/domain/investor/heatmap — per-region readiness/compliance + sector growth. */
export function fetchHeatmap(): Promise<HeatmapSignal> {
  return domainGet<{ heatmap: HeatmapSignal | HeatmapSignal[] }>("/investor/heatmap")
    .then(({ heatmap }) => Array.isArray(heatmap) ? heatmap[0] ?? EMPTY_HEATMAP : heatmap ?? EMPTY_HEATMAP);
}
