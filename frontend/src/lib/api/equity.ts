// frontend/src/lib/api/equity.ts
//
// Collaborator equity domain — BACKEND /api/domain/collaborator/equity.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface CapTableRow {
  label: string;
  percent: number;
  highlighted?: boolean;
}

export interface EquityHolding {
  projectId: string;
  projectName: string;
  projectLogo?: string;
  equityPercent: number;
  valueUSD: number;
  vestedPercent: number;
  vestingSchedule?: { years: number; cliffMonths: number };
  grantDate?: string;
  nextVest: { date: string; deltaPercent: number } | null;
  capTable?: CapTableRow[];
}

export interface VestingTimelinePoint { monthIso: string; vestedPercent: number; }
export interface VestingTimelineSeries { projectId: string; projectName: string; points: VestingTimelinePoint[]; }

export interface EquityTotals {
  totalValueUSD: number;
  blendedEquityPercent: number;
  vestedThisQuarterUSD: number;
  nextVest: { startup: string; date: string; deltaPercent: number } | null;
}

export interface CollaboratorEquity {
  holdings: EquityHolding[];
  totals: EquityTotals;
  vestingTimeline: VestingTimelineSeries[];
}

export const EMPTY_EQUITY: CollaboratorEquity = {
  holdings: [],
  totals: {
    totalValueUSD: 0,
    blendedEquityPercent: 0,
    vestedThisQuarterUSD: 0,
    nextVest: null,
  },
  vestingTimeline: [],
};

/** GET /api/domain/collaborator/equity — holdings + totals + vesting timeline. */
export async function fetchCollaboratorEquity(): Promise<CollaboratorEquity> {
  const data = await domainGet<Partial<CollaboratorEquity>>("/collaborator/equity");
  return {
    holdings: Array.isArray(data.holdings) ? data.holdings : [],
    vestingTimeline: Array.isArray(data.vestingTimeline) ? data.vestingTimeline : [],
    totals: {
      totalValueUSD: Number(data.totals?.totalValueUSD) || 0,
      blendedEquityPercent: Number(data.totals?.blendedEquityPercent) || 0,
      vestedThisQuarterUSD: Number(data.totals?.vestedThisQuarterUSD) || 0,
      nextVest: data.totals?.nextVest ?? null,
    },
  };
}

export interface DilutionRequest {
  projectId: string;
  newSharesPercent: number;
  consentGiven: boolean;
}
export interface DilutionResult {
  projectId: string;
  newSharesPercent: number;
  consentGiven: boolean;
  protectedApplied: boolean;
  equityBefore: number;
  equityAfter: number;
  shieldedEquity: number;
}

/** POST /api/domain/collaborator/equity/dilution — apply dilution honoring protection. */
export function applyDilution(body: DilutionRequest): Promise<DilutionResult> {
  return domainPost<DilutionResult>("/collaborator/equity/dilution", body);
}
