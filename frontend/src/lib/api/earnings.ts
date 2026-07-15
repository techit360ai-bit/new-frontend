// frontend/src/lib/api/earnings.ts
//
// Collaborator earnings/payouts domain — BACKEND /api/domain/collaborator/earnings.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface CashEarning {
  projectId: string;
  projectName: string;
  earned: number;
  pending: number;
  revenueSharePercent: number;
  contributionNote: string;
}

export interface Payout {
  id: string;
  monthIso: string;
  amount: number;
  status: "paid" | "processing";
}

export interface CashTotals {
  lifetimeUSD: number;
  pendingUSD: number;
  revenueShareTTMUsd: number;
}

export interface CollaboratorEarnings {
  cashEarnings: CashEarning[];
  payouts: Payout[];
  totals: CashTotals;
}

export const EMPTY_EARNINGS: CollaboratorEarnings = {
  cashEarnings: [],
  payouts: [],
  totals: {
    lifetimeUSD: 0,
    pendingUSD: 0,
    revenueShareTTMUsd: 0,
  },
};

/** GET /api/domain/collaborator/earnings — per-project earnings + payout ledger + totals. */
export function fetchCollaboratorEarnings(): Promise<CollaboratorEarnings> {
  return domainGet<CollaboratorEarnings>("/collaborator/earnings");
}

export interface WithdrawRequest {
  amount: number;
  destination?: string;
  monthIso?: string;
  idemKey?: string;
}
export interface WithdrawResult {
  ok: boolean;
  error?: string;
  available?: number;
  payout?: Payout;
  destination?: string;
  newPendingUSD?: number;
}

/** POST /api/domain/collaborator/earnings/withdraw — request a withdrawal of pending funds. */
export function requestWithdrawal(body: WithdrawRequest): Promise<WithdrawResult> {
  return domainPost<WithdrawResult>("/collaborator/earnings/withdraw", body);
}
