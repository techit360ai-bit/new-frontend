import type { CollaboratorDirectoryEntry } from "@/lib/api/users";

export interface CollaborationInviteDraft {
  projectId: string;
  projectName: string;
  summary: string;
  scope: string;
  requestedRole: string;
  requiredSkills: string[];
  desiredWeeklyHours: number;
  earliestStart: "this-week" | "2-weeks" | "1-month";
  commitmentStyle: "deep" | "parallel" | "many";
  compensationMode: "equity-heavy" | "equity-cash" | "cash-only";
  equityProposal?: number;
  cashReward?: number;
  industry?: string;
  stage?: string;
  audienceRoles?: CollaborationAudienceRole[];
}

export type CollaborationAudienceRole = "collaborator" | "founder" | "explorer";

export interface MatchContext {
  timezone?: string | null;
  location?: string | null;
}

export interface RankedCollaborator {
  profile: CollaboratorDirectoryEntry;
  score: number;
  reasons: string[];
}

const STORAGE_PREFIX = "techit.collaboration-invite.";

function normalized(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ");
}

function tokens(value: unknown): string[] {
  return normalized(value).split(" ").filter((token) => token.length > 1);
}

function textMatch(left: string, right: string): boolean {
  const a = normalized(left);
  const b = normalized(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  const rightTokens = new Set(tokens(b));
  return tokens(a).some((token) => rightTokens.has(token));
}

function bounded(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function startRank(value: string): number {
  return { "this-week": 0, "2-weeks": 1, "1-month": 2 }[value] ?? 3;
}

export function inviteStorageKey(projectId: string): string {
  return `${STORAGE_PREFIX}${projectId}`;
}

export function saveCollaborationInvite(draft: CollaborationInviteDraft): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(inviteStorageKey(draft.projectId), JSON.stringify(draft));
}

export function loadCollaborationInvite(projectId: string): CollaborationInviteDraft | null {
  if (!projectId || typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(inviteStorageKey(projectId));
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<CollaborationInviteDraft>;
    if (!value.projectId || !value.projectName || !value.summary || !value.scope || !value.requestedRole) return null;
    return {
      projectId: String(value.projectId),
      projectName: String(value.projectName),
      summary: String(value.summary),
      scope: String(value.scope),
      requestedRole: String(value.requestedRole),
      requiredSkills: Array.isArray(value.requiredSkills) ? value.requiredSkills.map(String).filter(Boolean).slice(0, 12) : [],
      desiredWeeklyHours: bounded(Number(value.desiredWeeklyHours ?? 10), 1, 80),
      earliestStart: value.earliestStart === "2-weeks" || value.earliestStart === "1-month" ? value.earliestStart : "this-week",
      commitmentStyle: value.commitmentStyle === "parallel" || value.commitmentStyle === "many" ? value.commitmentStyle : "deep",
      compensationMode: value.compensationMode === "equity-cash" || value.compensationMode === "cash-only" ? value.compensationMode : "equity-heavy",
      equityProposal: bounded(Number(value.equityProposal ?? 0), 0, 30),
      cashReward: bounded(Number(value.cashReward ?? 0), 0, 1_000_000),
      industry: value.industry ? String(value.industry) : undefined,
      stage: value.stage ? String(value.stage) : undefined,
      audienceRoles: Array.isArray(value.audienceRoles)
        ? value.audienceRoles.filter((role): role is CollaborationAudienceRole => role === "collaborator" || role === "founder" || role === "explorer")
        : undefined,
    };
  } catch {
    return null;
  }
}

export function rankCollaborators(
  profiles: CollaboratorDirectoryEntry[],
  draft: CollaborationInviteDraft,
  context: MatchContext = {},
): RankedCollaborator[] {
  return profiles
    .map((profile) => {
      let score = 0;
      const reasons: string[] = [];
      const capabilityTerms = [
        profile.role,
        profile.title,
        profile.discipline,
        ...profile.skills,
        ...profile.subSkills,
        ...profile.techStack,
      ].filter(Boolean);

      if (capabilityTerms.some((term) => textMatch(draft.requestedRole, term))) {
        score += 15;
        reasons.push(`Role fit: ${draft.requestedRole}`);
      }

      const matchedSkills = draft.requiredSkills.filter((skill) => (
        capabilityTerms.some((term) => textMatch(skill, term))
      ));
      if (draft.requiredSkills.length > 0) {
        score += 25 * (matchedSkills.length / draft.requiredSkills.length);
      }
      if (matchedSkills.length > 0) reasons.push(`Skills: ${matchedSkills.slice(0, 3).join(", ")}`);

      if (profile.weeklyHours > 0) {
        const availability = Math.min(1, profile.weeklyHours / Math.max(1, draft.desiredWeeklyHours));
        score += 15 * availability;
        if (availability >= 1) reasons.push(`${profile.weeklyHours}h/week available`);
      }
      if (profile.earliestStart && startRank(profile.earliestStart) <= startRank(draft.earliestStart)) {
        score += 3;
        reasons.push("Start timing fits");
      }
      if (profile.commitmentStyle && profile.commitmentStyle === draft.commitmentStyle) {
        score += 2;
        reasons.push("Commitment style fits");
      }

      const equity = bounded(Number(draft.equityProposal ?? 0), 0, 30);
      const cash = bounded(Number(draft.cashReward ?? 0), 0, 1_000_000);
      if (equity > 0) {
        score += profile.equityPreference > 0
          ? 14 * bounded(profile.equityPreference / 100, 0.25, 1)
          : 7;
        reasons.push("Open to equity proposal");
      }
      if (cash > 0) {
        const cashFit = profile.minCashFloor > 0 ? Math.min(1, cash / profile.minCashFloor) : 1;
        score += 6 * cashFit;
        if (cashFit >= 1) reasons.push("Cash support meets stated floor");
      } else if (equity > 0 && profile.minCashFloor === 0) {
        score += 6;
      }

      score += 10 * bounded(profile.credibilityScore / 100, 0, 1);
      if (profile.credibilityScore >= 70) reasons.push("Strong credibility signal");
      if (profile.isVerified) {
        score += 5;
        reasons.push("Verified profile");
      }

      const sameTimezone = normalized(context.timezone) && normalized(context.timezone) === normalized(profile.timezone);
      const sameLocation = normalized(context.location) && normalized(context.location) === normalized(profile.location);
      if (sameTimezone || sameLocation) {
        score += 3;
        reasons.push(sameTimezone ? "Same timezone" : "Same location");
      }
      if (draft.industry && profile.industries.some((industry) => textMatch(draft.industry ?? "", industry))) {
        score += 2;
        reasons.push(`Industry experience: ${draft.industry}`);
      }

      return {
        profile,
        score: Math.round(bounded(score, 0, 100)),
        reasons: reasons.slice(0, 4),
      };
    })
    .sort((a, b) => b.score - a.score || a.profile.name.localeCompare(b.profile.name));
}
