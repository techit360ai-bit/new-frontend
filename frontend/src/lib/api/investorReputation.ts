// frontend/src/lib/api/investorReputation.ts
//
// Investor Reputation domain — BACKEND /api/domain/investor/reputation.

import { domainGet } from "@/lib/domainApi";

export interface RepMetric {
  key: string;
  label: string;
  score: number;
  description: string;
}
export interface RepReview {
  founderName: string;
  startup: string;
  rating: number;
  comment: string;
  date: string;
}
export interface RepProgression {
  month: string;
  score: number;
  change: number;
}
export interface InvestorReputation {
  score: number;
  level: string;
  monthChange: number;
  metrics: RepMetric[];
  reviews: RepReview[];
  progression: RepProgression[];
  leaderboard: { rank: number; total: number; percentile: number };
}

export const EMPTY_REPUTATION: InvestorReputation = {
  score: 0,
  level: "Unrated",
  monthChange: 0,
  metrics: [],
  reviews: [],
  progression: [],
  leaderboard: { rank: 0, total: 0, percentile: 0 },
};

/** GET /api/domain/investor/reputation */
export function fetchInvestorReputation(): Promise<InvestorReputation> {
  return domainGet<{ reputation: InvestorReputation | InvestorReputation[] }>("/investor/reputation")
    .then(({ reputation }) => Array.isArray(reputation) ? reputation[0] ?? EMPTY_REPUTATION : reputation ?? EMPTY_REPUTATION);
}
