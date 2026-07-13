// frontend/src/lib/api/opportunities.ts
//
// Collaborator opportunities - BACKEND /api/domain/opportunities.

import { domainGet, domainPatch } from "@/lib/domainApi";

export type CollaboratorOpportunityType = "project" | "advisory" | "gig" | "testing";
export type CollaboratorOpportunityRisk = "low" | "medium" | "high";
export type CollaboratorOpportunityStatus = "open" | "applied" | "passed";

export interface CollaboratorOpportunity {
  id: string;
  title: string;
  company: string;
  type: CollaboratorOpportunityType;
  cashCompMonthly: number;
  cashCompOneTime: number;
  equityPercent: number;
  timeCommitment: string;
  riskLevel: CollaboratorOpportunityRisk;
  teamQuality: number;
  matchScore: number;
  skills: string[];
  description: string;
  teamBios: { name: string; role: string }[];
  timeline: string;
  status: CollaboratorOpportunityStatus;
}

type OpportunityRecord = Record<string, unknown>;

function asRecord(value: unknown): OpportunityRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as OpportunityRecord)
    : {};
}

function firstString(record: OpportunityRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function firstNumber(record: OpportunityRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : fallback;
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

function teamBios(value: unknown): { name: string; role: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      const name = firstString(record, ["name"]);
      const role = firstString(record, ["role", "title"]);
      return name ? { name, role } : null;
    })
    .filter((item): item is { name: string; role: string } => Boolean(item));
}

export function normalizeCollaboratorOpportunity(value: unknown): CollaboratorOpportunity {
  const record = asRecord(value);
  const company = firstString(record, ["company", "companyName", "startupName", "ventureName"], "Unknown company");

  return {
    id: firstString(record, ["id", "opportunityId"], `opportunity-${company.toLowerCase().replace(/\s+/g, "-")}`),
    title: firstString(record, ["title", "role", "name"], "Untitled opportunity"),
    company,
    type: oneOf(record.type, ["project", "advisory", "gig", "testing"] as const, "project"),
    cashCompMonthly: firstNumber(record, ["cashCompMonthly", "monthlyCompensation", "monthlyCash"]),
    cashCompOneTime: firstNumber(record, ["cashCompOneTime", "oneTimeCompensation", "fixedFee"]),
    equityPercent: firstNumber(record, ["equityPercent", "equity", "equityComp"]),
    timeCommitment: firstString(record, ["timeCommitment", "commitment"], "Commitment TBD"),
    riskLevel: oneOf(record.riskLevel, ["low", "medium", "high"] as const, "medium"),
    teamQuality: firstNumber(record, ["teamQuality", "teamScore"]),
    matchScore: firstNumber(record, ["matchScore", "match"]),
    skills: stringList(record.skills),
    description: firstString(record, ["description", "summary"], "No description provided yet."),
    teamBios: teamBios(record.teamBios ?? record.team),
    timeline: firstString(record, ["timeline", "startDate", "duration"], "Timeline TBD"),
    status: oneOf(record.status, ["open", "applied", "passed"] as const, "open"),
  };
}

/** GET /api/domain/opportunities - persisted collaborator opportunity matches. */
export function fetchCollaboratorOpportunities(): Promise<CollaboratorOpportunity[]> {
  return domainGet<{ opportunities?: unknown[] }>("/opportunities").then((data) => {
    const rows = Array.isArray(data.opportunities) ? data.opportunities : [];
    return rows.map(normalizeCollaboratorOpportunity);
  });
}

/** PATCH /api/domain/opportunities/{id} - persist collaborator opportunity status. */
export function patchCollaboratorOpportunityStatus(
  opportunityId: string,
  status: CollaboratorOpportunityStatus,
): Promise<CollaboratorOpportunity> {
  return domainPatch<{ opportunity?: unknown }>(`/opportunities/${opportunityId}`, { status }).then((data) => (
    normalizeCollaboratorOpportunity(data.opportunity)
  ));
}
