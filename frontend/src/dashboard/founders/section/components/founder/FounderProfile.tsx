// frontend/src/dashboard/founders/section/components/founder/FounderProfile.tsx
import { Link } from "react-router-dom";
import { Github, Linkedin, Globe, Twitter, ExternalLink, Check, Building2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useFounderProfile,
  type FounderProfile as FounderProfileData,
  type FounderStage,
} from "@/contexts/UserContext";
import { fetchEndorsements, type Endorsement } from "@/lib/api/endorsements";
import { StartupPassport } from "./StartupPassport";
import { RoleAdditionPanel } from "@/components/profile/RoleAdditionPanel";

interface JourneyStage {
  id: string;
  label: string;
  status: "complete" | "active" | "upcoming";
  progress: number;
  detail: string;
}

const FOUNDER_STAGES: FounderStage[] = ["Idea", "MVP", "Beta", "Launch", "Growth"];

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildJourney(profile: FounderProfileData): JourneyStage[] {
  const founderProjects = profile.founderProjects ?? [];
  const openRoles = profile.openRoles ?? [];
  const activeIndex = Math.max(0, FOUNDER_STAGES.indexOf(profile.stage));
  const primaryProject =
    founderProjects.find((project) => project.isPrimary) ?? founderProjects[0];
  const activeProgress = primaryProject ? clampProgress(primaryProject.gsisScore) : 0;
  const details: Record<FounderStage, string> = {
    Idea:
      founderProjects.length > 0
        ? `${founderProjects.length} persisted venture${founderProjects.length === 1 ? "" : "s"} in your portfolio.`
        : "No persisted venture has been added yet.",
    MVP:
      openRoles.length > 0
        ? `${profile.currentTeamSize} team members and ${openRoles.length} open role${openRoles.length === 1 ? "" : "s"}.`
        : `${profile.currentTeamSize} team members and no open roles.`,
    Beta: primaryProject
      ? `${primaryProject.title} has a GSIS score of ${clampProgress(primaryProject.gsisScore)}.`
      : "Add a persisted venture to track execution progress.",
    Launch: `Launch status: ${(profile.launchStatus ?? "pre-launch").replace(/-/g, " ")}.`,
    Growth: profile.nextMilestone
      ? `Next milestone: ${profile.nextMilestone}`
      : "No next milestone has been recorded.",
  };

  return FOUNDER_STAGES.map((stage, index) => ({
    id: stage.toLowerCase(),
    label: stage,
    status: index < activeIndex ? "complete" : index === activeIndex ? "active" : "upcoming",
    progress: index < activeIndex ? 100 : index === activeIndex ? activeProgress : 0,
    detail: details[stage],
  }));
}

export function FounderProfile() {
  const { founderProfile: rawProfile } = useFounderProfile();
  const p = useMemo(() => ({
    ...rawProfile,
    name: rawProfile.name || "Founder",
    openRoles: Array.isArray(rawProfile.openRoles) ? rawProfile.openRoles : [],
    industries: Array.isArray(rawProfile.industries) ? rawProfile.industries : [],
    founderProjects: Array.isArray(rawProfile.founderProjects) ? rawProfile.founderProjects : [],
    pinnedWork: Array.isArray(rawProfile.pinnedWork) ? rawProfile.pinnedWork : [],
    hackathonRegistrations: Array.isArray(rawProfile.hackathonRegistrations) ? rawProfile.hackathonRegistrations : [],
    teamWorkspaces: Array.isArray(rawProfile.teamWorkspaces) ? rawProfile.teamWorkspaces : [],
    needsFromTechIT: Array.isArray(rawProfile.needsFromTechIT) ? rawProfile.needsFromTechIT : [],
    links: rawProfile.links ?? { github: "", linkedin: "", twitter: "", personal: "" },
    verification: {
      github: rawProfile.verification?.github ?? { verified: false },
      twitter: rawProfile.verification?.twitter ?? { verified: false },
      linkedin: rawProfile.verification?.linkedin ?? { verified: false },
      personalSite: rawProfile.verification?.personalSite ?? { verified: false },
      nin: rawProfile.verification?.nin ?? { status: "unverified" },
    },
  } as FounderProfileData), [rawProfile]);
  const openRoles = p.openRoles;
  const industries = p.industries;
  const [endorsements, setEndorsements] = useState<Endorsement[]>([]);
  const [endorsementsLoading, setEndorsementsLoading] = useState(true);
  const [endorsementsError, setEndorsementsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setEndorsementsLoading(true);
    setEndorsementsError(null);
    fetchEndorsements()
      .then((rows) => {
        if (alive) setEndorsements(Array.isArray(rows) ? rows : []);
      })
      .catch((error) => {
        if (!alive) return;
        setEndorsements([]);
        setEndorsementsError(
          error instanceof Error ? error.message : "Live endorsements are unavailable.",
        );
      })
      .finally(() => {
        if (alive) setEndorsementsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const initials = p.name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const v = p.verification;
  const isVerified =
    v.github.verified ||
    v.twitter.verified ||
    v.linkedin.verified ||
    v.personalSite.verified ||
    v.nin.status === "verified";

  const ownershipLabel: Record<string, string> = {
    "equity-day-one": "Collaborators earn equity from day one",
    "cash-first-equity-later": "Cash-first now, equity at seed",
    custom: "Custom — negotiated per-person",
  };
  const compLabel: Record<string, string> = {
    "equity-heavy": "Equity-heavy",
    "cash-equity-mix": "Cash + equity",
    "cash-heavy": "Cash-heavy",
  };
  const launchLabel: Record<string, string> = {
    "pre-launch": "Pre-launch",
    "private-beta": "Private beta",
    public: "Public",
  };
  const founderTypeLabel: Record<string, string> = {
    "first-time": "First time",
    "some-experience": "Some experience",
    serial: "Serial",
  };
  const stageStyles: Record<string, string> = {
    Idea: "bg-surface-secondary text-text-secondary",
    MVP: "bg-violet-50 text-violet-700",
    Beta: "bg-status-warning-soft text-status-warning",
    Launch: "bg-status-success-soft text-status-success",
    Growth: "bg-status-success-soft text-status-success",
  };

  const rolesQuery = encodeURIComponent(openRoles.join(","));
  const matchresultsHref =
    openRoles.length > 0 ? `/matchresults?roles=${rolesQuery}` : "/matchresults";

  const journey = useMemo(() => buildJourney(p), [p]);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">

      <RoleAdditionPanel />

      {/* 1. Header strip */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6 flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-violet-600 text-white text-xl font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-text-primary">{p.name}</h1>
            {isVerified && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-status-success-soft text-status-success inline-flex items-center gap-1">
                <Check className="w-3 h-3" />
                Verified
              </span>
            )}
          </div>
          <p className="text-sm text-text-muted">
            {p.title} · {p.location} · {p.yearsBuilding} years building ·{" "}
            {founderTypeLabel[p.founderType] ?? "Founder"}
          </p>
          <p className="text-base text-text-secondary italic mt-2">"{p.headline}"</p>
          <p className="text-xs text-text-muted mt-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-status-success rounded-full" />
            Building · {p.currentTeamSize} cofounders · {openRoles.length} of 5 roles open
          </p>
        </div>
        <Link
          to="/founder/settings#identity"
          className="text-sm text-violet-600 hover:underline shrink-0"
        >
          Edit profile →
        </Link>
      </div>

      {/* 2. Startup hero */}
      <Link
        to="/incubation-hub"
        className="block border border-border-default bg-surface-primary rounded-xl p-6 hover:border-violet-300 transition-colors"
      >
        <div className="flex items-start gap-4">
                  <Building2 className="h-9 w-9 text-text-muted" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-text-primary">{p.startupName}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${stageStyles[p.stage] ?? stageStyles.Idea}`}>
                {p.stage ?? "Idea"}
              </span>
            </div>
            <p className="text-sm text-text-muted mb-1">{p.oneLiner ?? "No venture summary has been added yet."}</p>
            <p className="text-xs text-text-muted mb-4">
              Founded {p.foundingYear} · {industries.join(" · ")}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-border-subtle pt-4">
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  {(p.users ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Active users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  ${(p.revenueMonthly ?? 0).toLocaleString()}/mo
                </p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Revenue</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">
                  {launchLabel[p.launchStatus] ?? "Pre-launch"}
                </p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Launch status</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary tabular-nums">
                  ${(p.fundingRaised ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-text-muted uppercase tracking-wider">Funding</p>
              </div>
            </div>
            <p className="text-xs text-text-muted mt-3">Next milestone: {p.nextMilestone}</p>
          </div>
        </div>
      </Link>

      {/* 3. Mission */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Mission</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Why I'm building this</p>
            <p className="text-sm text-text-secondary">"{p.whyBuilding}"</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">What winning looks like</p>
            <p className="text-sm text-text-secondary">"{p.winningIn3Years}"</p>
          </div>
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider">Unfair advantage</p>
            <p className="text-sm text-text-secondary">"{p.unfairAdvantage}"</p>
          </div>
        </div>
      </div>

      {/* 4. Compensation philosophy */}
      <div className="border border-violet-200 bg-violet-50 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-violet-700 uppercase tracking-wider mb-2">
          Building for Ownership
        </h2>
        <p className="text-base text-text-primary">{ownershipLabel[p.ownershipPhilosophy]}</p>
        <p className="text-sm text-text-secondary mt-1">
          {p.equityRangeMin ?? 0}%–{p.equityRangeMax ?? 0}% range · {compLabel[p.compensationOffered] ?? "Not specified"}
        </p>
      </div>

      {/* 5. Open roles */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">
          Open roles ({openRoles.length} of 5)
        </h2>
        {openRoles.length === 0 ? (
          <p className="text-sm text-text-muted">No open roles right now.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {openRoles.map((role) => (
                <div key={role} className="border border-border-default bg-surface-primary rounded-lg p-3">
                  <p className="text-sm font-semibold text-text-primary">{role}</p>
                  <p className="text-xs text-text-muted mt-1 tabular-nums">
                    {p.equityRangeMin ?? 0}–{p.equityRangeMax ?? 0}% equity
                  </p>
                  <p className="text-xs text-text-muted">{compLabel[p.compensationOffered] ?? "Not specified"}</p>
                </div>
              ))}
            </div>
            <Link
              to={matchresultsHref}
              className="text-sm text-violet-600 hover:underline mt-3 inline-block"
            >
              See all collaborators matching these roles →
            </Link>
          </>
        )}
      </div>

      {/* 6. Stage journey (compact, read-only) */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Journey</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {journey.map((stage) => {
            const cardClass =
              stage.status === "active"
                ? "border-violet-200 bg-violet-50"
                : stage.status === "complete"
                ? "border-violet-200 bg-surface-primary"
                : "border-border-default bg-background-primary";
            const labelClass =
              stage.status === "active"
                ? "text-violet-700"
                : stage.status === "complete"
                ? "text-text-secondary"
                : "text-text-disabled";
            return (
              <div key={stage.id} className={`border rounded-lg p-3 ${cardClass}`}>
                <p className={`text-xs font-semibold ${labelClass}`}>{stage.label}</p>
                {stage.status !== "upcoming" && (
                  <div className="mt-2 h-1 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                )}
                <p className="text-xs text-text-muted mt-1">{stage.detail}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Recent endorsements (top 3) */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Recent endorsements</h2>
        {endorsementsLoading && (
          <p className="text-sm text-text-muted">Loading live endorsements...</p>
        )}
        {!endorsementsLoading && endorsementsError && (
          <p className="text-sm text-status-error">
            Live endorsements are unavailable: {endorsementsError}
          </p>
        )}
        {!endorsementsLoading && !endorsementsError && endorsements.length === 0 && (
          <p className="text-sm text-text-muted">No live endorsements are recorded yet.</p>
        )}
        {!endorsementsLoading && !endorsementsError && endorsements.length > 0 && (
          <div className="space-y-3">
            {endorsements.slice(0, 3).map((endorsement) => (
              <div key={endorsement.id} className="border border-border-default bg-surface-primary rounded-lg p-4">
                <p className="text-sm text-text-secondary">"{endorsement.quote}"</p>
                <p className="text-xs text-text-muted mt-2">
                  {endorsement.authorName} · {endorsement.authorRole}
                  {endorsement.projectName ? ` · ${endorsement.projectName}` : ""}
                  {endorsement.createdAt
                    ? ` · ${new Date(endorsement.createdAt).toLocaleDateString()}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <StartupPassport />

      {/* 8. Pinned work (only if present) */}
      {(p.pinnedWork ?? []).length > 0 && (
        <div className="border border-border-default bg-surface-primary rounded-xl p-6">
          <h2 className="text-sm font-semibold text-text-secondary mb-4">Pinned work</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(p.pinnedWork ?? []).slice(0, 3).map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="border border-border-default bg-surface-primary rounded-lg p-3 flex items-center gap-2 hover:border-violet-300"
              >
                <ExternalLink className="w-4 h-4 text-text-disabled shrink-0" />
                <span className="text-sm text-text-secondary truncate">{url}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 9. Verification */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary">Verification</h2>
          <Link
            to="/founder/settings#verification"
            className="text-xs text-violet-600 hover:underline"
          >
            Complete verification →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          {[
            { label: "GitHub",        verified: v.github.verified },
            { label: "X / Twitter",   verified: v.twitter.verified },
            { label: "LinkedIn",      verified: v.linkedin.verified },
            { label: "Personal site", verified: v.personalSite.verified },
            { label: "ID / NIN",      verified: v.nin.status === "verified" },
          ].map((b) => (
            <span
              key={b.label}
              className={`px-2.5 py-1 rounded-full inline-flex items-center gap-1 ${
                b.verified
                  ? "bg-status-success-soft text-status-success"
                  : "bg-surface-secondary text-text-muted"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  b.verified ? "bg-status-success" : "bg-slate-400"
                }`}
              />
              {b.verified ? `${b.label} verified` : `${b.label} unverified`}
            </span>
          ))}
        </div>
      </div>

      {/* 10. Social links */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary mb-4">Links</h2>
        <div className="flex flex-wrap gap-4 text-sm">
          {p.links?.github && (
            <a
              href={`https://${p.links.github.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-text-secondary hover:text-violet-600"
            >
              <Github className="w-4 h-4" /> {p.links.github}
            </a>
          )}
          {p.links?.linkedin && (
            <a
              href={`https://${p.links.linkedin.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-text-secondary hover:text-violet-600"
            >
              <Linkedin className="w-4 h-4" /> {p.links.linkedin}
            </a>
          )}
          {p.links?.twitter && (
            <span className="flex items-center gap-1.5 text-text-secondary">
              <Twitter className="w-4 h-4" /> {p.links.twitter}
            </span>
          )}
          {p.links?.personal && (
            <a
              href={`https://${p.links.personal.replace(/^https?:\/\//, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-text-secondary hover:text-violet-600"
            >
              <Globe className="w-4 h-4" /> {p.links.personal}
            </a>
          )}
        </div>
      </div>

    </div>
  );
}
