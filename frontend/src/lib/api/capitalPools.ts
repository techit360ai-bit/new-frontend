// frontend/src/lib/api/capitalPools.ts
//
// Investor Capital Pools domain — BACKEND /api/domain/investor/capital-pools.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface CapitalPool {
  id: string;
  name: string;
  totalCapital: number;
  deployed: number;
  startups: number;
  milestonesHit: number;
  fundsReleased: number;
  roiSimulation: number;
  rules?: { minReadiness?: number; maxPerStartup?: number; milestoneTrigger?: boolean };
}

/** GET /api/domain/investor/capital-pools */
export function fetchCapitalPools(): Promise<CapitalPool[]> {
  return domainGet<{ capitalPools: CapitalPool[] }>("/investor/capital-pools")
    .then((data) => data.capitalPools ?? []);
}

/** POST /api/domain/investor/capital-pools */
export function createCapitalPool(body: Partial<CapitalPool>): Promise<{ ok: boolean; pool: CapitalPool }> {
  return domainPost<{ capitalPool: CapitalPool }>("/investor/capital-pools", body)
    .then(({ capitalPool }) => ({ ok: true, pool: capitalPool }));
}
