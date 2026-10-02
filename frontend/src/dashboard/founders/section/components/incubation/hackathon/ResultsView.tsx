import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Lock, Trophy, ExternalLink } from "lucide-react";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { momentumColor } from "@/dashboard/_shared/hackathon/momentum";
import { roleDashboardPath } from "@/lib/roleRoutes";
import { PromoteToStartupModal } from "./PromoteToStartupModal";

interface Props {
  registration: HackathonRegistration;
}

const SUB_SCORES: { key: "problemClarity" | "innovationGap" | "initialImpact"; label: string }[] = [
  { key: "problemClarity", label: "Problem Clarity" },
  { key: "innovationGap",  label: "Innovation Gap" },
  { key: "initialImpact",  label: "Initial Impact" },
];

const LINKS: { key: "demoUrl" | "deckUrl" | "videoUrl"; label: string }[] = [
  { key: "demoUrl",  label: "Demo" },
  { key: "deckUrl",  label: "Pitch deck" },
  { key: "videoUrl", label: "Video" },
];

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = momentumColor(score);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-secondary">{label}</span>
        <span className={`text-xs font-semibold ${color.text}`}>{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-surface-secondary">
        <div className={`h-1.5 rounded-full ${color.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// Placement standing → color band: top third emerald, middle amber, lower slate.
function placementColor(placement: number, cohortSize: number): { text: string; ring: string } {
  const pct = placement / cohortSize;
  if (pct <= 1 / 3) return { text: "text-status-success", ring: "border-status-success bg-status-success-soft" };
  if (pct <= 2 / 3) return { text: "text-status-warning", ring: "border-status-warning bg-status-warning-soft" };
  return { text: "text-text-muted", ring: "border-border-default bg-background-primary" };
}

export function ResultsView({ registration }: Props) {
  const { finalSubmission, judgeFeedback, briefScore } = registration;
  const [promoteOpen, setPromoteOpen] = useState(false);

  if (!finalSubmission) {
    return (
      <div className="border border-border-default bg-surface-primary rounded-xl p-12 text-center">
        <h2 className="text-base font-semibold text-text-secondary mb-2">Results unavailable</h2>
        <p className="text-sm text-text-muted">Submit your final pitch to see judging results.</p>
      </div>
    );
  }

  if (!judgeFeedback) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border border-status-warning bg-status-warning-soft rounded-xl p-6">
          <h2 className="text-base font-semibold text-amber-900">Judging pending</h2>
          <p className="mt-1 text-sm text-status-warning">
            Your final pitch is persisted. Results will appear after judge feedback is recorded.
          </p>
        </div>
        <SubmissionDetails registration={registration} />
      </div>
    );
  }

  const band = placementColor(judgeFeedback.placement, judgeFeedback.cohortSize);
  const overallColor = briefScore ? momentumColor(briefScore.overall) : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Placement badge */}
      <div className={`border rounded-xl p-6 flex items-center gap-4 ${band.ring}`}>
        <Trophy className={`w-8 h-8 shrink-0 ${band.text}`} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-muted">Final results</p>
          <p className={`text-2xl font-bold ${band.text}`}>
            #{judgeFeedback.placement}{" "}
            <span className="text-base font-medium text-text-muted">of {judgeFeedback.cohortSize}</span>
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      {briefScore && overallColor && (
        <div className="border border-border-default bg-surface-primary rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Score breakdown</h3>
            <span className={`text-2xl font-bold ${overallColor.text}`}>{briefScore.overall}</span>
          </div>
          {SUB_SCORES.map((s) => (
            <ScoreBar key={s.key} score={briefScore[s.key]} label={s.label} />
          ))}
        </div>
      )}

      {/* Judge comments */}
      <div className="border border-border-default bg-surface-primary rounded-xl p-6">
        <h3 className="text-base font-semibold text-text-primary mb-3">Judge feedback</h3>
        <ul className="space-y-2">
          {judgeFeedback.comments.map((c, i) => (
            <li key={i} className="text-sm text-text-secondary flex gap-2">
              <span className="text-text-on-inverse-secondary">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <SubmissionDetails registration={registration} />

      {registration.promotedProjectId ? (
        <div className="border border-status-success bg-status-success-soft rounded-xl p-5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-status-success mb-2"><CheckCircle className="h-4 w-4" aria-hidden="true" />Promoted to startup</p>
          <div className="flex flex-wrap gap-3">
            <Link to={`/team-workspace/${registration.teamId}`} className="text-sm font-medium text-violet-700 hover:underline">Open workspace</Link>
            <Link to={roleDashboardPath.founder} className="text-sm font-medium text-violet-700 hover:underline">View in portfolio</Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setPromoteOpen(true)}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700">
            Promote to startup
          </button>
        </div>
      )}
      {promoteOpen && <PromoteToStartupModal registration={registration} onClose={() => setPromoteOpen(false)} />}
    </div>
  );
}

function SubmissionDetails({ registration }: Props) {
  const submission = registration.finalSubmission;
  if (!submission) return null;

  return (
    <div className="border border-border-default bg-surface-primary rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-text-disabled" />
        <h3 className="text-base font-semibold text-text-primary">Final submission</h3>
        <span className="ml-auto text-xs text-text-muted">Locked</span>
      </div>
      <dl className="space-y-3">
        <div>
          <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">Summary</dt>
          <dd className="text-sm text-text-primary mt-0.5 whitespace-pre-wrap">{submission.summary}</dd>
        </div>
        {LINKS.map((link) => (
          <div key={link.key}>
            <dt className="text-xs font-medium text-text-muted uppercase tracking-wider">{link.label}</dt>
            <dd className="mt-0.5">
              <a
                href={submission[link.key]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800 break-all"
              >
                {submission[link.key]} <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
