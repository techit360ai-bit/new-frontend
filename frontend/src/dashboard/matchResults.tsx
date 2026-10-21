import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Mail,
  MessageCircle,
  GitCompare,
  Star,
  Award,
  FileText,
  PieChart,
  Download,
  Printer,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useFounderProfile } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import { HackathonMatchBanner } from "@/dashboard/founders/section/components/founder/HackathonMatchBanner";
import { inviteHackathonCollaborator } from "@/lib/api/hackathon";
import { fetchFounderOpportunity } from "@/lib/api/opportunities";
import {
  connectWithUser,
  fetchCollaboratorDirectory,
  type CollaboratorDirectoryEntry,
} from "@/lib/api/users";
import {
  loadCollaborationInvite,
  rankCollaborators,
  type CollaborationInviteDraft,
} from "@/lib/collaborationMatching";
import { fetchFounderCollaboratorRecommendations } from "@/lib/api/recommendationIntelligence";
import {
  cofounderFrontendEnabled,
  createCofounderInvitation,
  fetchCofounderRecommendations,
  fetchCofounderRequirements,
  recordCofounderCandidateEvent,
} from "@/lib/api/cofounder";
import { CoFounderComparison } from "@/dashboard/_shared/cofounder/CoFounderComparison";
import { CoFounderRequirementBuilder } from "@/dashboard/_shared/cofounder/CoFounderRequirementBuilder";
import { formatCommitment } from "@/dashboard/_shared/cofounder/helpers";
import type {
  CofounderRecommendation,
  CofounderRecommendationsResponse,
  CofounderRequirement,
} from "@/dashboard/_shared/cofounder/types";
import {
  markValidationStoryShown,
  ValidationStoryDialog,
  validationStoryDue,
} from "@/dashboard/founders/section/components/incubation/IncubationCollaborationPrompts";
import {
  fetchWorkspaces,
  inviteWorkspaceCollaborator,
  provisionWorkspace,
  type WorkspaceRef,
} from "@/lib/api/workspaces";

interface Match {
  id: string;
  name: string;
  role: string;
  skills: string[];
  avatar: string;
  weeklyHours: number;
  timezone: string;
  location: string;
  credibilityScore: number;
  isVerified: boolean;
  matchScore: number | null;
  matchReasons: string[];
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.length
    ? parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("")
    : "CO";
}

function roleTokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9+#.]+/).filter((word) => word.length > 1);
}

function directoryMatch(profile: CollaboratorDirectoryEntry, matchScore: number | null = null, matchReasons: string[] = []): Match {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.title || "Collaborator",
    skills: profile.skills,
    avatar: initials(profile.name),
    weeklyHours: profile.weeklyHours,
    timezone: profile.timezone,
    location: profile.location,
    credibilityScore: profile.credibilityScore,
    isVerified: profile.isVerified,
    matchScore,
    matchReasons,
  };
}

function matchingOpenRole(match: Match, openRoles: string[]): string {
  const profileWords = new Set(roleTokens([match.role, ...match.skills].join(" ")));
  return openRoles.find((role) => roleTokens(role).some((word) => profileWords.has(word)))
    ?? openRoles[0]
    ?? "";
}

function recommendationInitials(name: string): string {
  return initials(name);
}

function EvidencePill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-background-primary px-2.5 py-2">
      <p className="text-xs font-semibold tabular-nums text-text-primary">{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-text-muted">{label}</p>
    </div>
  );
}

function CofounderCandidateCard({
  recommendation,
  invited,
  inviting,
  compared,
  onInvite,
  onCompare,
}: {
  recommendation: CofounderRecommendation;
  invited: boolean;
  inviting: boolean;
  compared: boolean;
  onInvite: () => void;
  onCompare: () => void;
}) {
  const dimensions = Object.entries(recommendation.breakdown || {})
    .filter(([, dimension]) => dimension.value != null)
    .sort((left, right) => right[1].weight - left[1].weight)
    .slice(0, 5);
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 lg:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 items-start gap-3 sm:w-40 sm:flex-col sm:items-center sm:text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-cyan-500 text-xl font-bold text-white">
            {recommendationInitials(recommendation.candidate.name)}
          </div>
          <div>
            <div className="rounded-full border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {recommendation.cofounderFit == null ? 'Insufficient evidence' : `${recommendation.cofounderFit}% co-founder fit`}
            </div>
            <p className="mt-1 text-[10px] text-text-muted">{Math.round(recommendation.confidence * 100)}% confidence</p>
            <p className="mt-1 text-[10px] font-mono text-text-muted">{recommendation.policyVersion}</p>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-text-primary">{recommendation.candidate.name}</h3>
              <p className="text-sm text-text-muted">{recommendation.candidate.title || recommendation.claimed.title || 'Candidate'}</p>
              <p className="mt-1 text-xs text-text-muted">
                {[recommendation.candidate.country, recommendation.candidate.timezone].filter(Boolean).join(' · ') || 'Location not provided'}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-status-success-soft px-2.5 py-1 text-xs font-medium text-status-success">
              <Star className="size-3.5" /> {recommendation.label}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {recommendation.claimed.skills.slice(0, 10).map((skill) => (
              <span key={skill} className="rounded-full bg-status-info-soft px-2 py-1 text-xs text-brand-accent">{skill}</span>
            ))}
            {recommendation.claimed.skills.length === 0 && <span className="text-xs text-text-muted">No claimed skills recorded.</span>}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <EvidencePill label="Trust" value={recommendation.verified.trustScore == null ? 'Missing' : recommendation.verified.trustScore} />
            <EvidencePill label="Execution" value={recommendation.observed.executionScore == null ? 'Missing' : Math.round(recommendation.observed.executionScore)} />
            <EvidencePill label="Reliability" value={recommendation.observed.deliveryReliability == null ? 'Missing' : `${Math.round(recommendation.observed.deliveryReliability)}%`} />
            <EvidencePill label="Availability" value={recommendation.claimed.availabilityHours == null ? 'Missing' : `${recommendation.claimed.availabilityHours}h`} />
          </div>

          {dimensions.length > 0 && (
            <div className="mt-4 space-y-2">
              {dimensions.map(([key, dimension]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-text-secondary">{recommendation.strengths.find((item) => item.dimension === key)?.label || key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold tabular-nums text-text-primary">{Math.round(dimension.value || 0)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                    <div className="h-full rounded-full bg-violet-500" style={{ width: `${Math.max(0, Math.min(100, dimension.value || 0))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {recommendation.reasons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {recommendation.reasons.map((reason) => (
                <span key={reason} className="rounded-full border border-status-success bg-status-success-soft px-2 py-1 text-[10px] font-medium text-status-success">{reason}</span>
              ))}
            </div>
          )}

          {recommendation.concerns.length > 0 && (
            <div className="mt-3 rounded-lg border border-status-warning bg-status-warning-soft px-3 py-2 text-[11px] text-status-warning">
              {recommendation.concerns.map((concern) => `${concern.label}: ${concern.reason}`).join(' ')}
            </div>
          )}

          {recommendation.missingEvidence.length > 0 && (
            <p className="mt-2 text-[11px] text-text-muted">
              Missing evidence: {recommendation.missingEvidence.map((item) => item.label).join(', ')}
            </p>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              disabled={invited || inviting}
              onClick={onInvite}
              className="flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {invited ? <CheckCircle2 className="size-4" /> : <Mail className="size-4" />}
              {invited ? 'Invitation sent' : inviting ? 'Sending…' : 'Invite to co-founder discussion'}
            </button>
            <button
              type="button"
              onClick={onCompare}
              className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${compared ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-border-default text-text-secondary'}`}
            >
              <GitCompare className="size-4" /> {compared ? 'Selected to compare' : 'Compare'}
            </button>
            <button
              type="button"
              onClick={() => window.open(`/founder/messages?recipient=${encodeURIComponent(recommendation.candidate.id)}`, '_self')}
              className="flex items-center justify-center gap-2 rounded-lg bg-surface-secondary px-4 py-2 text-sm font-medium text-text-secondary"
            >
              <MessageCircle className="size-4" /> Message
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default function MatchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hackathonId = searchParams.get("hackathon");
  const projectId = searchParams.get("project");
  const { founderProfile } = useFounderProfile();
  const { profile: authProfile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const registration = hackathonId
    ? founderProfile.hackathonRegistrations.find((r) => r.hackathonId === hackathonId) ?? null
    : null;

  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());
  const [equity, setEquity] = useState<Record<string, number>>({});
  const [contractFor, setContractFor] = useState<Match | null>(null);
  const [projectName, setProjectName] = useState("");
  const [storyOpen, setStoryOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceRef[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [workspaceAccess, setWorkspaceAccess] = useState<"contributor" | "viewer">("contributor");
  const [relationshipType, setRelationshipType] = useState<"collaborator" | "co_founder">(
    searchParams.get("relationshipType") === "co_founder" ? "co_founder" : "collaborator",
  );
  const [cofounderProjectId, setCofounderProjectId] = useState(searchParams.get("project") || "");
  const [cofounderRequirement, setCofounderRequirement] = useState<CofounderRequirement | null>(null);
  const [cofounderResults, setCofounderResults] = useState<CofounderRecommendationsResponse | null>(null);
  const [cofounderRefresh, setCofounderRefresh] = useState(0);
  const [cofounderInvitedIds, setCofounderInvitedIds] = useState<Set<string>>(new Set());
  const [cofounderInvitingId, setCofounderInvitingId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const invitationDraft = useMemo<CollaborationInviteDraft | null>(
    () => projectId ? loadCollaborationInvite(projectId) : null,
    [projectId],
  );
  const primaryVentureId = founderProfile.founderProjects.find((venture) => venture.isPrimary)?.id
    || founderProfile.founderProjects[0]?.id
    || "";
  const effectiveCofounderProjectId = cofounderProjectId || projectId || primaryVentureId;
  const selectedCofounderProject = founderProfile.founderProjects.find((venture) => venture.id === effectiveCofounderProjectId) || null;

  useEffect(() => {
    if (invitationDraft && validationStoryDue()) {
      markValidationStoryShown();
      setStoryOpen(true);
    }
  }, [invitationDraft]);

  useEffect(() => {
    if (relationshipType === "co_founder") return;
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchCollaboratorDirectory(),
      hackathonId ? fetchFounderOpportunity(hackathonId) : Promise.resolve(null),
      invitationDraft ? fetchWorkspaces() : Promise.resolve([]),
      projectId ? fetchFounderCollaboratorRecommendations(projectId, { limit: 50 }).catch(() => null) : Promise.resolve(null),
    ])
      .then(([profiles, opportunity, workspaceRows, serverRecommendations]) => {
        if (!alive) return;
        const ranked = serverRecommendations?.recommendations?.length
          ? serverRecommendations.recommendations.map((row) => {
              const person = (row as any).collaborator || {};
              const profile = profiles.find((item) => item.id === person.id);
              return profile ? directoryMatch(profile, Number(row.score), Array.isArray(row.reasons) ? row.reasons : []) : null;
            }).filter(Boolean) as Match[]
          : invitationDraft
          ? rankCollaborators(profiles, invitationDraft, {
              timezone: authProfile?.timezone,
              location: authProfile?.country,
            }).map((row) => directoryMatch(row.profile, row.score, row.reasons))
          : profiles.map((profile) => directoryMatch(profile));
        setMatches(ranked);
        setHackathon(opportunity?.type === "hackathon" ? opportunity : null);
        const owned = workspaceRows.filter((workspace) => workspace.isOwner !== false);
        setWorkspaces(owned);
        const preferred = owned.find((workspace) => workspace.id === invitationDraft?.workspaceId)
          ?? owned.find((workspace) => workspace.projectId === invitationDraft?.projectId)
          ?? owned[0];
        if (preferred) setSelectedWorkspaceId(preferred.id);
      })
      .catch((loadError) => {
        if (!alive) return;
        setMatches([]);
        setHackathon(null);
        setError(loadError instanceof Error ? loadError.message : "Live collaborator profiles are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
    }, [authProfile?.country, authProfile?.timezone, hackathonId, invitationDraft, projectId, relationshipType]);

  useEffect(() => {
    if (relationshipType !== "co_founder") return;
    if (!cofounderFrontendEnabled()) {
      setLoading(false);
      setError("Co-founder Mode is not enabled for this frontend deployment.");
      return;
    }
    if (!effectiveCofounderProjectId) {
      setLoading(false);
      setCofounderRequirement(null);
      setCofounderResults(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    setMatches([]);
    setHackathon(null);
    fetchCofounderRequirements(effectiveCofounderProjectId)
      .then(async (requirementResult) => {
        if (!alive) return;
        setCofounderRequirement(requirementResult.requirement);
        if (!requirementResult.requirement) {
          setCofounderResults(null);
          return;
        }
        const results = await fetchCofounderRecommendations(effectiveCofounderProjectId, {
          requirementId: requirementResult.requirement.id,
          requirementVersion: requirementResult.requirement.version,
          limit: 50,
        });
        if (alive) {
          setCofounderResults(results);
          const candidateIds = results.recommendations.map((row) => row.candidate.id).slice(0, 20);
          if (candidateIds.length > 0) {
            void recordCofounderCandidateEvent('cofounder_candidate_viewed', {
              projectId: effectiveCofounderProjectId,
              candidateIds,
              requirementVersion: results.requirementVersion,
            }).catch(() => {});
          }
        }
      })
      .catch((loadError) => {
        if (!alive) return;
        setCofounderResults(null);
        setError(loadError instanceof Error ? loadError.message : "Co-founder recommendations are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [cofounderRefresh, effectiveCofounderProjectId, relationshipType]);

  useEffect(() => {
    if (!projectName) {
      setProjectName(invitationDraft?.projectName || registration?.teamName || founderProfile.startupName || "");
    }
  }, [founderProfile.startupName, invitationDraft?.projectName, projectName, registration?.teamName]);

  const visibleMatches = useMemo(() => {
    if (!hackathonId || !registration) return matches;
    if (registration.openRoles.length === 0) return [];
    const openRoleWords = new Set(
      registration.openRoles.flatMap(roleTokens),
    );
    return matches.filter((m) => {
      const matchWords = roleTokens([m.role, ...m.skills].join(" "));
      return matchWords.some((w) => openRoleWords.has(w));
    });
  }, [hackathonId, matches, registration]);

  const totalEquity = useMemo(
    () => Object.values(equity).reduce((a, b) => a + b, 0),
    [equity],
  );
  const founderRetained = Math.max(0, 100 - totalEquity);
  const over = totalEquity > 100;

  const handleHackathonInvite = async (match: Match, role: string) => {
    if (!hackathonId || !registration || !role) return;
    setInvitingIds((current) => new Set(current).add(match.id));
    try {
      const invitation = await inviteHackathonCollaborator(
        hackathonId,
        registration.teamId,
        match.id,
        role,
      );
      if (invitation.status !== "pending") {
        toast.error("The invitation was not persisted as pending.");
        return;
      }
      setInvitedIds((current) => new Set(current).add(match.id));
      toast.success(`Invited ${match.name} to ${registration.teamName} as ${role}.`);
    } catch (inviteError) {
      toast.error(inviteError instanceof Error ? inviteError.message : "The invitation could not be sent.");
    } finally {
      setInvitingIds((current) => {
        const next = new Set(current);
        next.delete(match.id);
        return next;
      });
    }
  };

  const handleConnect = async (match: Match) => {
    setInvitingIds((current) => new Set(current).add(match.id));
    try {
      if (invitationDraft) {
        let workspaceId = selectedWorkspaceId || invitationDraft.workspaceId || "";
        if (!workspaceId) {
          const provisioned = await provisionWorkspace(
            invitationDraft.projectId,
            `${invitationDraft.projectName} Workspace`,
          );
          if (!provisioned.ok || !provisioned.workspace?.id) throw new Error("A project workspace could not be created.");
          workspaceId = provisioned.workspace.id;
          setWorkspaces((current) => [...current, provisioned.workspace as WorkspaceRef]);
          setSelectedWorkspaceId(workspaceId);
        }
        await inviteWorkspaceCollaborator(workspaceId, {
          collaboratorId: match.id,
          requestedRole: invitationDraft.requestedRole,
          scope: invitationDraft.scope,
          requiredSkills: invitationDraft.requiredSkills,
          compensationMode: invitationDraft.compensationMode,
          equityProposal: (equity[match.id] ?? 0) > 0 ? equity[match.id] : invitationDraft.equityProposal,
          cashReward: invitationDraft.cashReward,
          accessLevel: workspaceAccess,
        });
      } else {
        await connectWithUser(match.id);
      }
      setInvitedIds((current) => new Set(current).add(match.id));
      toast.success(invitationDraft
        ? `Workspace invitation sent to ${match.name}.`
        : `Connection request sent to ${match.name}.`);
    } catch (connectError) {
      toast.error(connectError instanceof Error ? connectError.message : "The connection request could not be sent.");
    } finally {
      setInvitingIds((current) => {
        const next = new Set(current);
        next.delete(match.id);
        return next;
      });
    }
  };

  const handleCofounderInvite = async (recommendation: CofounderRecommendation) => {
    if (!cofounderRequirement || !effectiveCofounderProjectId) {
      toast.error("Save co-founder requirements before sending an invitation.");
      return;
    }
    setCofounderInvitingId(recommendation.candidate.id);
    try {
      await createCofounderInvitation({
        idempotencyKey: `cofounder-invite-${effectiveCofounderProjectId}-${recommendation.candidate.id}-${cofounderRequirement.version}`,
        projectId: effectiveCofounderProjectId,
        candidateId: recommendation.candidate.id,
        roleTitle: cofounderRequirement.roleTitle || recommendation.candidate.title || "Co-founder",
        responsibilities: cofounderRequirement.responsibilities,
        commitment: cofounderRequirement.commitment,
        ventureStage: cofounderRequirement.ventureStage,
        initialPeriodMonths: 3,
        equityDiscussionStatus: String(cofounderRequirement.compatibility?.equityDiscussionPreference || "to_be_discussed"),
        proposedTerms: {
          roleTitle: cofounderRequirement.roleTitle,
          responsibilities: cofounderRequirement.responsibilities,
          commitment: cofounderRequirement.commitment,
          ventureStage: cofounderRequirement.ventureStage,
          initialPeriodMonths: 3,
          equityDiscussionStatus: String(cofounderRequirement.compatibility?.equityDiscussionPreference || "to_be_discussed"),
        },
      });
      setCofounderInvitedIds((current) => new Set(current).add(recommendation.candidate.id));
      toast.success(`Co-founder discussion invitation sent to ${recommendation.candidate.name}.`);
    } catch (inviteError) {
      toast.error(inviteError instanceof Error ? inviteError.message : "The co-founder invitation could not be sent.");
    } finally {
      setCofounderInvitingId(null);
    }
  };

  const toggleCompare = (candidateId: string) => {
    const next = compareIds.includes(candidateId)
      ? compareIds.filter((id) => id !== candidateId)
      : [...compareIds, candidateId].slice(-4);
    setCompareIds(next);
    if (next.includes(candidateId) && cofounderResults) {
      void recordCofounderCandidateEvent('cofounder_candidate_compared', {
        projectId: effectiveCofounderProjectId,
        candidateIds: next,
        requirementVersion: cofounderResults.requirementVersion,
      }).catch(() => {});
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      <main className="flex-1 overflow-y-auto bg-linear-to-b from-slate-100 via-indigo-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-6 lg:py-12">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              {relationshipType === "co_founder" ? "Co-founder Discovery" : "Collaborator Directory"}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground">
              {relationshipType === "co_founder"
                ? "Deterministic, relationship-aware co-founder recommendations"
                : "Live collaborator profiles from the authenticated TechIT directory"}
            </p>
            <div className="mt-4 inline-flex rounded-xl border border-border-default bg-surface-primary p-1">
              <button
                type="button"
                onClick={() => { setRelationshipType("collaborator"); setError(null); }}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${relationshipType === "collaborator" ? "bg-brand-accent text-white" : "text-text-secondary"}`}
              >
                Core Team Member
              </button>
              <button
                type="button"
                onClick={() => { setRelationshipType("co_founder"); setError(null); }}
                className={`rounded-lg px-3 py-2 text-xs font-medium ${relationshipType === "co_founder" ? "bg-violet-600 text-white" : "text-text-secondary"}`}
              >
                Co-founder
              </button>
            </div>
          </div>

          {relationshipType === "collaborator" && invitationDraft && (
            <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950">
              <p className="font-semibold">Profile-based matches for {invitationDraft.projectName}</p>
              <p className="mt-1 text-xs text-violet-800">{invitationDraft.summary}</p>
              <p className="mt-2 text-xs"><span className="font-semibold">Scope:</span> {invitationDraft.scope}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-violet-900">
                  Workspace
                  <select value={selectedWorkspaceId} onChange={(event) => setSelectedWorkspaceId(event.target.value)} className="mt-1 w-full rounded-md border border-violet-200 bg-surface-primary px-3 py-2 text-sm">
                    {workspaces.length === 0 && <option value="">Create {invitationDraft.projectName} Workspace when inviting</option>}
                    {workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-violet-900">
                  Access after acceptance
                  <select value={workspaceAccess} onChange={(event) => setWorkspaceAccess(event.target.value as "contributor" | "viewer")} className="mt-1 w-full rounded-md border border-violet-200 bg-surface-primary px-3 py-2 text-sm">
                    <option value="contributor">Contributor - tasks and reports</option>
                    <option value="viewer">Viewer - read only</option>
                  </select>
                </label>
              </div>
              <p className="mt-2 text-[11px] text-violet-700">Ranked from disclosed skills, availability, start timing, compensation preferences, credibility, verification, timezone/location and industry. Scores are transparent fit indicators, not predictions.</p>
            </div>
          )}

          {relationshipType === "co_founder" && (
            <div className="mb-6 space-y-4">
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-950 dark:border-violet-900/60 dark:bg-violet-950/20 dark:text-violet-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="font-semibold">Co-founder fit is calculated only by the backend.</p>
                    <p className="mt-1 text-xs opacity-80">Ranking uses the versioned {cofounderResults?.policy.version || "cofounder-fit-v1"} policy. Missing compatibility evidence stays missing and is never imputed.</p>
                  </div>
                  {founderProfile.founderProjects.length > 0 && (
                    <label className="text-xs font-semibold">
                      Venture
                      <select
                        value={effectiveCofounderProjectId}
                        onChange={(event) => {
                          setCofounderProjectId(event.target.value);
                          setCompareIds([]);
                          setComparisonOpen(false);
                        }}
                        className="mt-1 w-full rounded-lg border border-violet-200 bg-surface-primary px-3 py-2 text-sm text-text-primary sm:w-64"
                      >
                        {founderProfile.founderProjects.map((venture) => (
                          <option key={venture.id} value={venture.id}>{venture.title}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
                {cofounderResults && (
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] opacity-80">
                    <span>Requirement v{cofounderResults.requirementVersion}</span>
                    <span>{cofounderResults.meta.returned as number} of {cofounderResults.meta.totalCandidates as number} eligible candidates</span>
                    <span>{cofounderResults.context.roleTitle ? String(cofounderResults.context.roleTitle) : "Role title not set"}</span>
                    <span>{typeof cofounderResults.context.commitment === "object" ? formatCommitment(cofounderResults.context.commitment as Record<string, unknown>) : "Commitment not specified"}</span>
                  </div>
                )}
              </div>

              {effectiveCofounderProjectId ? (
                <CoFounderRequirementBuilder
                  key={effectiveCofounderProjectId}
                  ventureId={effectiveCofounderProjectId}
                  compact
                  onSaved={(requirement) => {
                    setCofounderRequirement(requirement);
                    setCofounderRefresh((current) => current + 1);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-border-default bg-surface-primary p-5 text-sm text-text-muted">
                  Create or analyze a venture before running co-founder discovery.
                </div>
              )}

              {cofounderResults?.recommendedCandidate && (
                <div className="rounded-xl border border-status-success bg-status-success-soft p-4 text-sm text-status-success">
                  <p className="font-semibold">Highest deterministic fit: {cofounderResults.recommendedCandidate.name}</p>
                  <p className="mt-1 text-xs">{cofounderResults.recommendedCandidate.explanation}</p>
                  {cofounderResults.recommendedCandidate.missingEvidence.length > 0 && (
                    <p className="mt-1 text-[11px]">Missing evidence: {cofounderResults.recommendedCandidate.missingEvidence.map((item) => item.label).join(", ")}</p>
                  )}
                </div>
              )}

              {compareIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setComparisonOpen((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white"
                >
                  <GitCompare className="size-4" /> {comparisonOpen ? "Hide comparison" : `Compare selected (${compareIds.length})`}
                </button>
              )}

              {comparisonOpen && cofounderResults && (
                <CoFounderComparison
                  recommendations={cofounderResults.recommendations}
                  candidateIds={compareIds}
                  onClose={() => setComparisonOpen(false)}
                  onInvite={(recommendation) => void handleCofounderInvite(recommendation)}
                  invitationDisabled={!cofounderRequirement}
                />
              )}
            </div>
          )}

          {/* Project + Equity Allocation Summary */}
          {relationshipType === "collaborator" && <div className="bg-card rounded-xl border border-border p-4 lg:p-5 mb-6 lg:mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Project name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name"
                  className="w-full bg-transparent text-lg font-semibold text-foreground border-b border-border focus:border-brand-accent outline-none pb-1"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Equity allocated
                  </div>
                  <div
                    className={`text-2xl font-bold ${over ? "text-status-error" : "text-brand-accent dark:text-brand-accent"}`}
                  >
                    {totalEquity}%
                  </div>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="text-right">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                    Founder retains
                  </div>
                  <div
                    className={`text-2xl font-bold ${over ? "text-status-error" : "text-status-success dark:text-status-success"}`}
                  >
                    {founderRetained}%
                  </div>
                </div>
              </div>
            </div>

            {/* Allocation bar */}
            <div className="mt-4 h-3 rounded-full bg-slate-200 dark:bg-surface-inverse-muted overflow-hidden flex">
              {visibleMatches.map((m, i) => {
                const pct = equity[m.id] ?? 0;
                const colors = [
                  "bg-status-info-soft",
                  "bg-cyan-500",
                  "bg-fuchsia-500",
                  "bg-status-warning",
                ];
                return (
                  <div
                    key={m.id}
                    className={`${colors[i % colors.length]} transition-all`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                    title={`${m.name}: ${pct}%`}
                  />
                );
              })}
            </div>
            {over && (
              <div className="mt-2 text-xs text-status-error font-semibold">
                Total equity exceeds 100%. Reduce one or more proposals before generating contracts.
              </div>
            )}
          </div>}

          {/* Match Cards Grid */}
          {relationshipType === "collaborator" && hackathonId && <HackathonMatchBanner hackathon={hackathon} teamName={registration?.teamName ?? null} />}
          {loading && (
            <div className="border border-border rounded-xl bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">{relationshipType === "co_founder" ? "Computing deterministic co-founder matches..." : "Loading live collaborator profiles..."}</p>
            </div>
          )}
          {!loading && error && (
            <div className="border border-status-error rounded-xl bg-status-error-soft p-6 text-sm text-status-error">
              {error}
            </div>
          )}
          {!loading && !error && (relationshipType === "co_founder" ? !cofounderResults?.recommendations.length : visibleMatches.length === 0) && (
            <div className="border border-border-default rounded-xl bg-surface-primary p-8 text-center">
              <p className="text-sm text-text-secondary font-medium">
                {relationshipType === "co_founder"
                  ? !effectiveCofounderProjectId
                    ? "Select or create a venture to begin co-founder discovery."
                    : !cofounderRequirement
                      ? "Save the explicit co-founder requirements to generate matches."
                      : "No eligible co-founder candidates are available for this requirement yet."
                  : hackathonId
                    ? "No live collaborator profiles match the team's open roles."
                    : "No collaborator profiles are available yet."}
              </p>
            </div>
          )}
          <div className="grid gap-6">
            {relationshipType === "co_founder" ? (
              (cofounderResults?.recommendations || []).map((recommendation) => (
                <CofounderCandidateCard
                  key={recommendation.candidate.id}
                  recommendation={recommendation}
                  invited={cofounderInvitedIds.has(recommendation.candidate.id)}
                  inviting={cofounderInvitingId === recommendation.candidate.id}
                  compared={compareIds.includes(recommendation.candidate.id)}
                  onInvite={() => void handleCofounderInvite(recommendation)}
                  onCompare={() => toggleCompare(recommendation.candidate.id)}
                />
              ))
            ) : visibleMatches.map((match, index) => {
              const pct = equity[match.id] ?? 0;
              const invitationRole = registration ? matchingOpenRole(match, registration.openRoles) : "";
              const inviting = invitingIds.has(match.id);
              return (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-xl p-4 lg:p-6 border border-border hover:border-brand-accent/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6">
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-full sm:w-auto flex sm:flex-col items-start sm:items-center gap-4 sm:gap-2">
                      <div className="size-16 sm:size-20 rounded-full bg-linear-to-br from-brand-accent to-cyan-500 flex items-center justify-center text-xl sm:text-2xl font-bold text-white shrink-0">
                        {match.avatar}
                      </div>
                      {/* Match Badge */}
                      <div className="px-3 py-1 bg-status-success/20 text-status-success dark:text-status-success rounded-full text-xs sm:text-sm font-medium text-center">
                        {match.matchScore !== null ? `${match.matchScore}% profile fit` : match.isVerified ? "Verified profile" : "Live profile"}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 lg:mb-4 gap-2 sm:gap-0">
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                            {match.name}
                          </h3>
                          <div className="text-sm text-muted-foreground mb-2">
                            {match.role}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Award className="size-4" />
                              {match.weeklyHours > 0 ? `${match.weeklyHours}h/week` : "Availability not specified"}
                            </span>
                            {(match.location || match.timezone) && <span>•</span>}
                            <span>{[match.location, match.timezone].filter(Boolean).join(" · ")}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                          <Star className="size-4 text-status-warning" />
                          {match.credibilityScore > 0
                            ? `${match.credibilityScore} credibility`
                            : "No credibility score"}
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-2 mb-3 lg:mb-4">
                        {match.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-status-info-soft dark:bg-status-info-soft/20 text-brand-accent dark:text-brand-accent rounded-full text-xs sm:text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      {match.matchReasons.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {match.matchReasons.map((reason) => (
                            <span key={reason} className="rounded-full border border-status-success bg-status-success-soft px-2 py-1 text-[11px] font-medium text-status-success">{reason}</span>
                          ))}
                        </div>
                      )}

                      {/* Equity proposal slider */}
                      <div className="bg-background-primary dark:bg-background-inverse/40 border border-border rounded-lg p-3 mb-3 lg:mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
                            <PieChart className="size-4 text-brand-accent" />
                            Equity proposal
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-brand-accent dark:text-brand-accent tabular-nums">
                            {pct}%
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          step={0.5}
                          value={pct}
                          onChange={(e) =>
                            setEquity((prev) => ({
                              ...prev,
                              [match.id]: parseFloat(e.target.value),
                            }))
                          }
                          className="w-full accent-indigo-600"
                          aria-label={`Equity proposal for ${match.name}`}
                        />
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                          <span>0%</span>
                          <span>15%</span>
                          <span>30%</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                        {hackathonId && registration ? (
                          invitedIds.has(match.id) ? (
                            <button
                              type="button"
                              disabled
                              className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-status-success-soft text-status-success border border-status-success cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                            >
                              <CheckCircle2 className="size-4" />
                              <span>Invited</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleHackathonInvite(match, invitationRole)}
                              disabled={!invitationRole || inviting}
                              className="flex-1 sm:flex-none py-2 px-4 rounded-lg bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 text-sm"
                            >
                              <Mail className="size-4" />
                              <span>{inviting ? "Sending..." : `Invite as ${invitationRole || "open role"}`}</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => void handleConnect(match)}
                            disabled={invitedIds.has(match.id) || inviting}
                            className="flex-1 sm:flex-none py-2 px-4 bg-brand-accent hover:bg-status-info-soft disabled:bg-slate-300 text-white rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                          >
                            {invitedIds.has(match.id) ? <CheckCircle2 className="size-4" /> : <Mail className="size-4" />}
                            <span>{invitedIds.has(match.id) ? "Request sent" : inviting ? "Sending..." : "Connect"}</span>
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/founder/messages?recipient=${encodeURIComponent(match.id)}`)}
                          className="flex-1 sm:flex-none py-2 px-4 bg-slate-200 dark:bg-surface-inverse-muted hover:bg-slate-300 dark:hover:bg-slate-700 text-text-secondary dark:text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                        >
                          <MessageCircle className="size-4" />
                          <span>Message</span>
                        </button>
                        <button
                          onClick={() => setContractFor(match)}
                          disabled={pct <= 0 || over || !projectName.trim()}
                          className="flex-1 sm:flex-none py-2 px-4 bg-status-success hover:bg-status-success disabled:bg-slate-300 dark:disabled:bg-surface-inverse-muted disabled:text-text-muted disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                          title={
                            !projectName.trim()
                              ? "Set a project name first"
                              : pct <= 0
                              ? "Set an equity proposal first"
                              : over
                                ? "Total equity exceeds 100%"
                                : "Generate term-of-contract preview"
                          }
                        >
                          <FileText className="size-4" />
                          <span>Generate Contract</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Term-of-Contract modal */}
      {contractFor && (
        <ContractModal
          match={contractFor}
          projectName={projectName}
          equity={equity[contractFor.id] ?? 0}
          onClose={() => setContractFor(null)}
        />
      )}
      {invitationDraft && (
        <ValidationStoryDialog
          open={storyOpen}
          onOpenChange={setStoryOpen}
          project={{
            id: invitationDraft.projectId,
            name: invitationDraft.projectName,
            summary: invitationDraft.summary,
            industry: invitationDraft.industry,
            stage: invitationDraft.stage,
          }}
          sessionId={invitationDraft.projectId}
        />
      )}
    </div>
  );
}

function ContractModal({
  match,
  projectName,
  equity,
  onClose,
}: {
  match: Match;
  projectName: string;
  equity: number;
  onClose: () => void;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const weeklyHours = match.weeklyHours;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-linear-to-r from-emerald-50 to-indigo-50 dark:from-emerald-950/40 dark:to-indigo-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-status-success dark:text-status-success font-semibold uppercase tracking-wider">
              <CheckCircle2 className="size-3.5" />
              Term of Contract — Draft
            </div>
            <h2 className="text-xl font-bold text-foreground mt-1">
              {projectName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-surface-inverse-muted transition-colors"
            aria-label="Close contract preview"
          >
            <X className="size-4 text-foreground" />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-sm text-foreground">
          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Parties
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background-primary dark:bg-background-inverse/40 rounded-lg p-3 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Founder
                </div>
                <div className="font-semibold">You</div>
                <div className="text-xs text-muted-foreground">
                  Project owner — {projectName}
                </div>
              </div>
              <div className="bg-background-primary dark:bg-background-inverse/40 rounded-lg p-3 border border-border">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                  Collaborator
                </div>
                <div className="font-semibold">{match.name}</div>
                <div className="text-xs text-muted-foreground">
                  {match.role}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Allocation
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-status-info-soft dark:bg-indigo-950/40 border border-brand-accent/50 dark:border-indigo-800/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-brand-accent dark:text-brand-accent font-semibold mb-1">
                  Equity grant
                </div>
                <div className="text-xl font-bold text-brand-accent dark:text-brand-accent">
                  {equity}%
                </div>
              </div>
              <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/50 dark:border-cyan-800/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                  Weekly hours
                </div>
                <div className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
                  {weeklyHours}h
                </div>
              </div>
              <div className="bg-status-success-soft dark:bg-emerald-950/40 border border-status-success/50 dark:border-emerald-800/50 rounded-lg p-3">
                <div className="text-[10px] uppercase tracking-wider text-status-success dark:text-status-success font-semibold mb-1">
                  Effective date
                </div>
                <div className="text-sm font-semibold text-status-success dark:text-status-success">
                  {today}
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Role &amp; responsibilities
            </h3>
            <p className="text-sm leading-relaxed text-foreground/80">
              {match.name} is engaged as <strong>{match.role}</strong> on{" "}
              <strong>{projectName}</strong>, committing approximately{" "}
              <strong>{weeklyHours} hours per week</strong>. Areas of focus
              include {match.skills.length ? match.skills.join(", ") : "the agreed project scope"}. Specific deliverables and
              milestones will be tracked through the TechIT workspace.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Vesting schedule
            </h3>
            <p className="text-sm leading-relaxed text-foreground/80">
              Equity vests over <strong>48 months</strong> with a{" "}
              <strong>12-month cliff</strong>. Vesting accrues based on verified
              milestone completions logged on the TechIT platform. If{" "}
              {match.name} departs before the cliff date, no equity is granted.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Exit &amp; reallocation
            </h3>
            <p className="text-sm leading-relaxed text-foreground/80">
              On voluntary exit, unvested equity returns to the founder pool.
              On involuntary exit (cause), all unvested equity is forfeited.
              The platform maintains an immutable contribution record that
              persists regardless of equity outcome.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Notes
            </h3>
            <ul className="text-xs leading-relaxed text-muted-foreground space-y-1.5 list-disc pl-5">
              <li>
                This document is a draft generated by TechIT and is not legally
                binding until signed by both parties and counter-signed by a
                licensed professional.
              </li>
              <li>
                Dispute resolution defaults to mediation through the TechIT
                governance process before any external arbitration.
              </li>
              <li>
                Confidentiality and IP assignment clauses will be expanded in
                the final signed version.
              </li>
            </ul>
          </section>
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-end gap-2 bg-background-primary dark:bg-background-inverse/40">
          <button
            onClick={() => window.print()}
            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-surface-inverse-muted hover:bg-slate-300 dark:hover:bg-slate-700 text-foreground text-sm flex items-center gap-2 transition-colors"
          >
            <Printer className="size-4" />
            Print
          </button>
          <button
            onClick={() => {
              const blob = new Blob(
                [
                  `TechIT Term of Contract\n\nProject: ${projectName}\nCollaborator: ${match.name}\nRole: ${match.role}\nEquity: ${equity}%\nWeekly hours: ${weeklyHours}h\nEffective: ${today}\n`,
                ],
                { type: "text/plain" },
              );
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${projectName.replace(/\s+/g, "_")}_${match.name.replace(/\s+/g, "_")}_contract.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-2 rounded-lg bg-status-success hover:bg-status-success text-white text-sm flex items-center gap-2 transition-colors"
          >
            <Download className="size-4" />
            Download draft
          </button>
        </div>
      </motion.div>
    </div>
  );
}
