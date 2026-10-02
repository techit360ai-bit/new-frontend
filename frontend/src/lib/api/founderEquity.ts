// frontend/src/lib/api/founderEquity.ts
//
// Founder-facing cap table — BACKEND /api/domain/founder/equity.
//
// The platform only records ownership a founder committed to collaborators via
// workspace invitations. `retainedPercent` is therefore a DERIVED remainder
// (100 - committed) and excludes anything not tracked here (external investors,
// option pools, founder-declared splits). Nothing on this surface is invented.

import { domainGet } from "@/lib/domainApi";

export interface CapTableGrant {
  collaboratorId: string;
  collaboratorName: string;
  role: string;
  equityPercent: number;
  committedAt?: string | null;
}

export interface CapTableProposal {
  invitationId: string;
  collaboratorId: string;
  collaboratorName: string;
  role: string;
  equityPercent: number;
  invitedAt?: string | null;
  expiresAt?: string | null;
}

export interface CapTableVenture {
  workspaceId: string;
  projectId: string | null;
  name: string;
  committedPercent: number;
  retainedPercent: number;
  retainedDerived: boolean;
  grants: CapTableGrant[];
  pending: CapTableProposal[];
}

export interface FounderCapTable {
  ventures: CapTableVenture[];
  totals: {
    ventures: number;
    venturesWithEquity: number;
    committedGrants: number;
    pendingProposals: number;
    averageRetainedPercent: number;
  };
  basis: string;
}

export const EMPTY_CAP_TABLE: FounderCapTable = {
  ventures: [],
  totals: {
    ventures: 0,
    venturesWithEquity: 0,
    committedGrants: 0,
    pendingProposals: 0,
    averageRetainedPercent: 100,
  },
  basis: "",
};

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** GET /api/domain/founder/equity — committed + pending equity per venture. */
export async function fetchFounderCapTable(): Promise<FounderCapTable> {
  const data = await domainGet<Partial<FounderCapTable>>("/founder/equity");
  return {
    ventures: Array.isArray(data.ventures) ? data.ventures : [],
    totals: {
      ventures: num(data.totals?.ventures),
      venturesWithEquity: num(data.totals?.venturesWithEquity),
      committedGrants: num(data.totals?.committedGrants),
      pendingProposals: num(data.totals?.pendingProposals),
      averageRetainedPercent: num(data.totals?.averageRetainedPercent, 100),
    },
    basis: typeof data.basis === "string" ? data.basis : "",
  };
}
