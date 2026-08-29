// frontend/src/lib/api/opportunities.ts
//
// Collaborator opportunities - BACKEND /api/domain/opportunities.

import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";
import type { Event, Funding, Hackathon, Opportunity, Program } from "@/dashboard/_shared/opportunities/types";
import type { CollaborationAudienceRole, CollaborationInviteDraft } from "@/lib/collaborationMatching";

export type CollaboratorOpportunityType = "project" | "advisory" | "gig" | "testing" | "collaboration";
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
    type: oneOf(record.type, ["project", "advisory", "gig", "testing", "collaboration"] as const, "project"),
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
    return rows.filter((row) => visibleToAudience(row, "collaborator")).map(normalizeCollaboratorOpportunity);
  });
}

function visibleToAudience(value: unknown, role: "collaborator" | "founder"): boolean {
  const audience = asRecord(value).audienceRoles;
  return !Array.isArray(audience) || audience.length === 0 || audience.includes(role);
}

export async function broadcastCollaborationCall(
  draft: CollaborationInviteDraft,
  audienceRoles: CollaborationAudienceRole[],
): Promise<CollaboratorOpportunity> {
  const applyDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const data = await domainPost<{ opportunity?: unknown }>("/opportunities/collaboration-calls", {
    projectId: draft.projectId,
    title: `${draft.requestedRole} for ${draft.projectName}`.slice(0, 160),
    company: draft.projectName,
    summary: draft.summary,
    description: draft.summary,
    scope: draft.scope,
    role: draft.requestedRole,
    skills: draft.requiredSkills,
    compensationMode: draft.compensationMode,
    cashCompMonthly: draft.cashReward ?? 0,
    equityPercent: draft.equityProposal ?? 0,
    timeCommitment: `${draft.desiredWeeklyHours} hrs/week`,
    timeline: draft.earliestStart,
    commitmentStyle: draft.commitmentStyle,
    industry: draft.industry,
    stage: draft.stage,
    tags: [draft.industry, ...draft.requiredSkills].filter(Boolean).slice(0, 12),
    audienceRoles,
    applyDeadline,
    publishedAt: new Date().toISOString(),
    poster: "",
  });
  return normalizeCollaboratorOpportunity(data.opportunity);
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  message: string;
  status: string;
  createdAt: string;
}

export function applyToOpportunity(opportunityId: string, message: string): Promise<OpportunityApplication> {
  return domainPost<{ ok: true; application: OpportunityApplication }>(
    `/opportunities/${opportunityId}/apply`,
    { message },
  ).then((data) => data.application);
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

type PublishedRecord = Record<string, unknown>;

function publishedRecord(value: unknown): PublishedRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as PublishedRecord)
    : {};
}

function valueString(record: PublishedRecord, keys: string[], fallback = ""): string {
  for (const key of keys) {
    if (typeof record[key] === "string" && String(record[key]).trim()) return String(record[key]).trim();
  }
  return fallback;
}

function valueNumber(record: PublishedRecord, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return fallback;
}

function valueList(record: PublishedRecord, keys: string[]): string[] {
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key].filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  }
  return [];
}

function recordObject(value: unknown): PublishedRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as PublishedRecord)
    : {};
}

function organizer(record: PublishedRecord): { id: string; name: string; logoEmoji?: string } {
  const raw = recordObject(record.organizer);
  const logoEmoji = valueString(raw, ["logoEmoji"]);
  return {
    id: valueString(raw, ["id"], valueString(record, ["organizerId", "ownerId"], "organization")),
    name: valueString(raw, ["name"], valueString(record, ["organizerName", "organizationName"], "Organization")),
    ...(logoEmoji ? { logoEmoji } : {}),
  };
}

function baseOpportunity(record: PublishedRecord, type: Opportunity["type"]) {
  const rawStatus = valueString(record, ["status"]);
  const status: Opportunity["status"] =
    rawStatus === "closing-soon" || rawStatus === "closed"
      ? rawStatus
      : rawStatus === "draft" || rawStatus === "completed" || rawStatus === "judging"
        ? "closed"
        : "open";
  return {
    id: valueString(record, ["id", "opportunityId"]),
    type,
    title: valueString(record, ["title", "name"], "Untitled opportunity"),
    organizer: organizer(record),
    poster: valueString(record, ["poster"]),
    summary: valueString(record, ["summary", "description", "theme"]),
    status,
    applyDeadline: valueString(record, ["applyDeadline", "deadline"]),
    publishedAt: valueString(record, ["publishedAt", "createdAt"]),
    tags: valueList(record, ["tags"]),
    featured: Boolean(record.featured),
  };
}

export function normalizePublishedOpportunity(value: unknown): Opportunity | null {
  const record = publishedRecord(value);
  const type = valueString(record, ["type"]);
  if (!["hackathon", "program", "funding", "event", "collaboration"].includes(type)) return null;
  const base = baseOpportunity(record, type as Opportunity["type"]);
  if (!base.id) return null;

  if (type === "hackathon") {
    const rawStatus = valueString(record, ["hackathonStatus", "status"]);
    const hackathonStatus: Hackathon["hackathonStatus"] =
      rawStatus === "live" || rawStatus === "judging" || rawStatus === "completed"
        ? rawStatus
        : "upcoming";
    return {
      ...base,
      type: "hackathon",
      theme: valueString(record, ["theme"]),
      startDate: valueString(record, ["startDate"]),
      endDate: valueString(record, ["endDate"]),
      durationHours: valueNumber(record, ["durationHours"]),
      prizePool: valueString(record, ["prizePool"]),
      partners: valueList(record, ["partners"]),
      registrants: valueNumber(record, ["registrants"]),
      teamsFormed: valueNumber(record, ["teamsFormed"]),
      hackathonStatus,
    };
  }
  if (type === "program") {
    const format = valueString(record, ["format"]);
    return {
      ...base,
      type: "program",
      format: format === "accelerator" || format === "mentorship" ? format : "incubator",
      durationWeeks: valueNumber(record, ["durationWeeks"]),
      cohortSize: valueNumber(record, ["cohortSize"]),
      perks: valueList(record, ["perks"]),
      startDate: valueString(record, ["startDate"]),
    } satisfies Program;
  }
  if (type === "funding") {
    const format = valueString(record, ["format"]);
    return {
      ...base,
      type: "funding",
      format: format === "rfp" || format === "pilot" ? format : "grant",
      amountRange: valueString(record, ["amountRange", "amount"]),
      equityRequired: Boolean(record.equityRequired),
      audienceStage: valueList(record, ["audienceStage"]) as Funding["audienceStage"],
    } satisfies Funding;
  }
  if (type === "collaboration") {
    return {
      ...base,
      type: "collaboration",
      role: valueString(record, ["role", "requestedRole"]),
      skills: valueList(record, ["skills", "requiredSkills"]),
      scope: valueString(record, ["scope"]),
      timeCommitment: valueString(record, ["timeCommitment", "commitment"]),
      cashCompMonthly: valueNumber(record, ["cashCompMonthly", "monthlyCash"]),
      equityPercent: valueNumber(record, ["equityPercent", "equity"]),
      audienceRoles: valueList(record, ["audienceRoles"]).filter(
        (role): role is "collaborator" | "founder" | "explorer" => role === "collaborator" || role === "founder" || role === "explorer",
      ),
    };
  }
  const format = valueString(record, ["format"]);
  return {
    ...base,
    type: "event",
    format: ["masterclass", "ama", "panel", "workshop"].includes(format) ? format as Event["format"] : "demo-day",
    startDate: valueString(record, ["startDate"]),
    durationMinutes: valueNumber(record, ["durationMinutes"]),
    hostedBy: valueString(record, ["hostedBy"]),
    isVirtual: Boolean(record.isVirtual),
  } satisfies Event;
}

export function normalizePublishedHackathon(value: unknown): Hackathon | null {
  const record = publishedRecord(value);
  return normalizePublishedOpportunity({ ...record, type: "hackathon" }) as Hackathon | null;
}

export async function fetchFounderOpportunityCatalog(): Promise<Opportunity[]> {
  const [opportunityData, hackathonData] = await Promise.all([
    domainGet<{ opportunities?: unknown[] }>("/opportunities"),
    domainGet<{ hackathons?: unknown[] }>("/hackathons"),
  ]);
  const normalized = [
    ...(hackathonData.hackathons ?? []).map(normalizePublishedHackathon),
    ...(opportunityData.opportunities ?? [])
      .filter((row) => visibleToAudience(row, "founder"))
      .map(normalizePublishedOpportunity),
  ].filter((item): item is Opportunity => Boolean(item));
  return [...new Map(normalized.map((item) => [item.id, item])).values()];
}

export async function fetchFounderOpportunity(id: string): Promise<Opportunity | null> {
  const rows = await fetchFounderOpportunityCatalog();
  return rows.find((item) => item.id === id) ?? null;
}
