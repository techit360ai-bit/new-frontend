import { domainGet, domainPatch, domainPost } from "@/lib/domainApi";
import { normalizePublishedHackathon } from "@/lib/api/opportunities";
import type { Hackathon as PublishedHackathon } from "@/dashboard/_shared/opportunities/types";
import type {
  BriefScore as UiBriefScore,
  CheckIn,
  FinalSubmission,
  HackathonRegistration,
  IdeaBrief,
  JudgeFeedback,
  OpenRole,
} from "@/contexts/UserContext";

export interface HackathonOverview {
  hackathonId: string;
  status: string;
  registrants: number;
  teamsFormed: number;
  stillSolo: number;
  ideaSubmissions: number;
  totalTeams: number;
  avgBuildVelocity: number;
}

export interface VelocityCell {
  teamId: string;
  name: string;
  activity: number;
}

export interface LeaderboardEntry {
  teamId: string;
  name: string;
  composite: number;
  crsBand: string;
}

export interface PipelineBuckets {
  incubationInvites: number;
  prototypeTrack: number;
  backToLearning: number;
}

export interface BriefResult {
  ok: boolean;
  score?: UiBriefScore;
  critiques?: string[];
  registration?: HackathonRegistration;
}

export interface PersistedRegistrationInput {
  teamName: string;
  teamSize: number;
  inviteToken: string;
  openRoles: OpenRole[];
}

export interface InviteDetails {
  hackathon: Record<string, unknown>;
  teamId: string;
  teamName: string;
  teamSize: number;
  memberCount: number;
  openRoles: string[];
  rosterClosed: boolean;
  isLeader: boolean;
  leaderName: string;
  invitationId?: string;
  invitedRole?: string;
}

export interface HackathonInvitation {
  id: string;
  hackathonId: string;
  teamId: string;
  collaboratorId: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  updatedAt: string;
}

export interface HackathonPrize {
  rank: string;
  amount: string;
}

export interface OrganizerHackathon extends PublishedHackathon {
  eligibility: string;
  prizes: HackathonPrize[];
  judgingDimensions: string[];
  mentorPool: number;
  stillSolo: number;
}

export interface CreateOrganizerHackathonInput {
  title: string;
  theme: string;
  summary: string;
  visibility: "public" | "private";
  status: "draft" | "upcoming" | "live";
  hackathonStatus: "upcoming" | "live";
  applyDeadline: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  prizePool: string;
  eligibility: string;
  prizes: HackathonPrize[];
  judgingDimensions: string[];
  partners: string[];
  mentorPool: number;
  organizerName: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function numberValue(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function normalizePrizes(value: unknown): HackathonPrize[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      return {
        rank: stringValue(record.rank),
        amount: stringValue(record.amount),
      };
    })
    .filter((prize) => prize.rank || prize.amount);
}

export function normalizeOrganizerHackathon(value: unknown): OrganizerHackathon | null {
  const published = normalizePublishedHackathon(value);
  if (!published) return null;
  const record = asRecord(value);
  return {
    ...published,
    eligibility: stringValue(record.eligibility),
    prizes: normalizePrizes(record.prizes),
    judgingDimensions: stringList(record.judgingDimensions),
    mentorPool: numberValue(record.mentorPool),
    stillSolo: numberValue(record.stillSolo),
  };
}

export async function fetchOrganizerHackathons(): Promise<OrganizerHackathon[]> {
  const data = await domainGet<{ hackathons?: unknown[] }>("/hackathons?scope=owned");
  return (data.hackathons ?? [])
    .map(normalizeOrganizerHackathon)
    .filter((hackathon): hackathon is OrganizerHackathon => Boolean(hackathon));
}

export async function fetchOrganizerHackathon(id: string): Promise<OrganizerHackathon | null> {
  const data = await domainGet<{ hackathon?: unknown }>(`/hackathons/${encodeURIComponent(id)}`);
  return normalizeOrganizerHackathon(data.hackathon);
}

export async function createOrganizerHackathon(
  input: CreateOrganizerHackathonInput,
): Promise<OrganizerHackathon | null> {
  const data = await domainPost<{ hackathon?: unknown }>("/hackathons", input);
  return normalizeOrganizerHackathon(data.hackathon);
}

function normalizeBrief(value: unknown): IdeaBrief | undefined {
  const record = asRecord(value);
  if (!stringValue(record.problem) && !stringValue(record.solutionSketch)) return undefined;
  return {
    problem: stringValue(record.problem),
    targetUser: stringValue(record.targetUser),
    solutionSketch: stringValue(record.solutionSketch, stringValue(record.solution)),
    whyNow: stringValue(record.whyNow),
    differentiator: stringValue(record.differentiator),
    risk: stringValue(record.risk),
    successMetric: stringValue(record.successMetric),
    submittedAt: stringValue(record.submittedAt, stringValue(record.createdAt)),
  };
}

function normalizeScore(value: unknown, submittedAt: string): UiBriefScore | undefined {
  const record = asRecord(value);
  if (Object.keys(record).length === 0) return undefined;
  return {
    problemClarity: numberValue(record.problemClarity),
    innovationGap: numberValue(record.innovationGap),
    initialImpact: numberValue(record.initialImpact),
    overall: numberValue(record.overall, numberValue(record.composite)),
    critiques: {
      problemClarity: stringList(asRecord(record.critiques).problemClarity),
      innovationGap: stringList(asRecord(record.critiques).innovationGap),
      initialImpact: stringList(asRecord(record.critiques).initialImpact),
    },
    computedAt: stringValue(record.computedAt, submittedAt),
  };
}

function normalizeCheckIns(value: unknown): CheckIn[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    const status = stringValue(record.status);
    return {
      id: stringValue(record.id),
      loggedAt: stringValue(record.loggedAt, stringValue(record.createdAt)),
      status: status === "blocked" || status === "pivoted" ? status : "on-track",
      update: stringValue(record.update, stringValue(record.note)),
      ...(stringValue(record.blocker) ? { blocker: stringValue(record.blocker) } : {}),
    };
  });
}

export function normalizeHackathonRegistration(value: unknown): HackathonRegistration | null {
  const record = asRecord(value);
  const teamId = stringValue(record.teamId);
  const hackathonId = stringValue(record.hackathonId);
  if (!teamId || !hackathonId) return null;
  const brief = normalizeBrief(record.brief);
  const stage = stringValue(record.stage);
  const members = Array.isArray(record.members)
    ? record.members.map((item) => {
        const member = asRecord(item);
        return {
          collaboratorId: stringValue(member.collaboratorId, stringValue(member.userId, stringValue(member.id))),
          name: stringValue(member.name),
          role: stringValue(member.role),
          acceptedAt: stringValue(member.acceptedAt, stringValue(member.createdAt)),
        };
      })
    : [];
  const finalRecord = asRecord(record.finalSubmission);
  const feedbackRecord = asRecord(record.judgeFeedback);
  const finalSubmission: FinalSubmission | undefined =
    Object.keys(finalRecord).length > 0
      ? {
          demoUrl: stringValue(finalRecord.demoUrl),
          deckUrl: stringValue(finalRecord.deckUrl),
          videoUrl: stringValue(finalRecord.videoUrl),
          summary: stringValue(finalRecord.summary),
          submittedAt: stringValue(finalRecord.submittedAt, stringValue(finalRecord.createdAt)),
        }
      : undefined;
  const judgeFeedback: JudgeFeedback | undefined =
    Object.keys(feedbackRecord).length > 0
      ? {
          placement: numberValue(feedbackRecord.placement),
          cohortSize: numberValue(feedbackRecord.cohortSize),
          comments: stringList(feedbackRecord.comments),
          judgedAt: stringValue(feedbackRecord.judgedAt, stringValue(feedbackRecord.createdAt)),
        }
      : undefined;

  return {
    hackathonId,
    teamId,
    teamName: stringValue(record.teamName, "Untitled team"),
    teamSize: Math.max(1, numberValue(record.teamSize, members.length + 1 + stringList(record.openRoles).length)),
    role: stringValue(record.role) === "member" ? "member" : "leader",
    inviteToken: stringValue(record.inviteToken),
    registeredAt: stringValue(record.registeredAt, stringValue(record.createdAt)),
    members,
    openRoles: stringList(record.openRoles) as OpenRole[],
    stage:
      stage === "submitted" || stage === "building" || stage === "submitted-final"
        ? stage
        : "registered",
    rosterClosed: Boolean(record.rosterClosed),
    brief,
    briefScore: normalizeScore(record.briefScore, brief?.submittedAt ?? ""),
    checkIns: normalizeCheckIns(record.checkIns),
    finalSubmission,
    judgeFeedback,
    workspaceId: stringValue(record.workspaceId) || undefined,
    promotedProjectId: stringValue(record.promotedProjectId) || undefined,
  };
}

export function fetchHackathonOverview(id: string): Promise<HackathonOverview> {
  return domainGet<HackathonOverview>(`/hackathons/${encodeURIComponent(id)}/overview`);
}

export async function fetchHackathonVelocity(id: string): Promise<VelocityCell[]> {
  const data = await domainGet<{ teams?: Array<Record<string, unknown>> }>(
    `/hackathons/${encodeURIComponent(id)}/velocity`,
  );
  return (data.teams ?? []).map((team) => ({
    teamId: stringValue(team.teamId),
    name: stringValue(team.name),
    activity: numberValue(team.activity, numberValue(team.activityScore)),
  }));
}

export async function fetchHackathonLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  const data = await domainGet<{ leaderboard?: Array<Record<string, unknown>> }>(
    `/hackathons/${encodeURIComponent(id)}/leaderboard`,
  );
  return (data.leaderboard ?? []).map((team) => {
    const composite = numberValue(team.composite);
    return {
      teamId: stringValue(team.teamId),
      name: stringValue(team.name),
      composite,
      crsBand: stringValue(team.crsBand, composite >= 70 ? "strong" : composite >= 40 ? "developing" : "early"),
    };
  });
}

export function fetchHackathonPipeline(id: string): Promise<PipelineBuckets> {
  return domainGet<{ buckets: PipelineBuckets }>(`/hackathons/${encodeURIComponent(id)}/pipeline`)
    .then(({ buckets }) => buckets);
}

export async function fetchHackathonRegistrations(): Promise<HackathonRegistration[]> {
  const data = await domainGet<{ registrations?: unknown[] }>("/hackathons/registrations");
  return (data.registrations ?? [])
    .map(normalizeHackathonRegistration)
    .filter((registration): registration is HackathonRegistration => Boolean(registration));
}

export async function registerHackathonTeam(
  id: string,
  input: PersistedRegistrationInput,
): Promise<HackathonRegistration | null> {
  const data = await domainPost<{ registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/register`,
    input,
  );
  return normalizeHackathonRegistration(data.registration);
}

export async function submitHackathonBrief(
  id: string,
  body: Record<string, unknown>,
): Promise<BriefResult> {
  const data = await domainPost<{ ok: boolean; registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/brief`,
    body,
  );
  return {
    ok: data.ok,
    registration: normalizeHackathonRegistration(data.registration) ?? undefined,
  };
}

export async function logHackathonCheckIn(
  id: string,
  body: Record<string, unknown>,
): Promise<{ ok: boolean; registration?: HackathonRegistration | null }> {
  const data = await domainPost<{ ok: boolean; registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/checkin`,
    body,
  );
  return {
    ok: data.ok,
    registration: normalizeHackathonRegistration(data.registration),
  };
}

export async function submitHackathonFinal(
  id: string,
  teamId: string,
  submission: FinalSubmission,
): Promise<{ ok: boolean; registration?: HackathonRegistration | null }> {
  const data = await domainPost<{ ok: boolean; registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/final`,
    { submission },
  );
  return {
    ok: data.ok,
    registration: normalizeHackathonRegistration(data.registration),
  };
}

export function patchHackathonTeam(
  id: string,
  teamId: string,
  body: { rosterClosed: boolean },
): Promise<HackathonRegistration | null> {
  return domainPatch<{ registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}`,
    body,
  ).then((data) => normalizeHackathonRegistration(data.registration));
}

export async function fetchHackathonInvite(
  id: string,
  teamId: string,
  token: string,
): Promise<InviteDetails> {
  const data = await domainGet<{ invite: InviteDetails }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/invite?token=${encodeURIComponent(token)}`,
  );
  return data.invite;
}

export async function acceptHackathonInvite(
  id: string,
  teamId: string,
  token: string,
  role: string,
): Promise<HackathonRegistration | null> {
  const data = await domainPost<{ registration?: unknown }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/invite`,
    { token, role },
  );
  return normalizeHackathonRegistration(data.registration);
}

export async function inviteHackathonCollaborator(
  id: string,
  teamId: string,
  collaboratorId: string,
  role: string,
): Promise<HackathonInvitation> {
  const data = await domainPost<{ invitation: HackathonInvitation }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/invitations`,
    { collaboratorId, role },
  );
  return data.invitation;
}

export function provisionTeamWorkspace(
  id: string,
  teamId: string,
  projectId?: string,
): Promise<{
  ok: boolean;
  workspace?: { id: string; projectId: string };
  registration?: HackathonRegistration | null;
}> {
  return domainPost<{
    ok: boolean;
    workspace?: { id: string; projectId: string };
    registration?: unknown;
  }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/workspace`,
    { projectId },
  ).then((data) => ({
    ok: data.ok,
    workspace: data.workspace,
    registration: normalizeHackathonRegistration(data.registration),
  }));
}

export function reportTeamToOrganizers(
  id: string,
  teamId: string,
  report: { workspaceId: string; idea: unknown; team: unknown; artifacts: unknown; stage: string },
): Promise<{ ok: boolean }> {
  return domainPost<{ ok: boolean }>(
    `/hackathons/${encodeURIComponent(id)}/teams/${encodeURIComponent(teamId)}/report`,
    report,
  );
}
