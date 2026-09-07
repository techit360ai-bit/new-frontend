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
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-xs font-bold ${color.text}`}>{score}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
        <div className={`h-2 rounded-full ${color.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// Placement standing → color band: top third emerald, middle amber, lower slate.
function placementColor(placement: number, cohortSize: number): { text: string; ring: string } {
  const pct = placement / cohortSize;
  if (pct <= 1 / 3) return { text: "text-emerald-500", ring: "border-emerald-500/20 bg-emerald-500/10" };
  if (pct <= 2 / 3) return { text: "text-amber-500", ring: "border-amber-500/20 bg-amber-500/10" };
  return { text: "text-slate-500", ring: "border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]" };
}

export function ResultsView({ registration }: Props) {
  const { finalSubmission, judgeFeedback, briefScore } = registration;
  const [promoteOpen, setPromoteOpen] = useState(false);

  if (!finalSubmission) {
    return (
      <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h2 className="text-base font-bold text-slate-700 dark:text-slate-300 mb-2">Results unavailable</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Submit your final pitch to see judging results.</p>
      </div>
    );
  }

  if (!judgeFeedback) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="border border-amber-500/20 bg-amber-500/10 rounded-2xl p-6">
          <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">Judging pending</h2>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
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
      <div className={`border rounded-2xl p-6 flex items-center gap-4 ${band.ring}`}>
        <Trophy className={`w-8 h-8 shrink-0 ${band.text}`} />
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Final results</p>
          <p className={`text-2xl font-bold ${band.text}`}>
            #{judgeFeedback.placement}{" "}
            <span className="text-base font-medium text-slate-500 dark:text-slate-400">of {judgeFeedback.cohortSize}</span>
          </p>
        </div>
      </div>

      {/* Score breakdown */}
      {briefScore && overallColor && (
        <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Score breakdown</h3>
            <span className={`text-2xl font-black ${overallColor.text}`}>{briefScore.overall}</span>
          </div>
          {SUB_SCORES.map((s) => (
            <ScoreBar key={s.key} score={briefScore[s.key]} label={s.label} />
          ))}
        </div>
      )}

      {/* Judge comments */}
      <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">Judge feedback</h3>
        <ul className="space-y-2.5">
          {judgeFeedback.comments.map((c, i) => (
            <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex gap-2">
              <span className="text-[#0066ff] dark:text-[#58a6ff]">•</span>
              <span>{c}</span>
            </li>
          ))}
        </ul>
      </div>

      <SubmissionDetails registration={registration} />

      {registration.promotedProjectId ? (
        <div className="border border-emerald-500/20 bg-emerald-500/10 rounded-2xl p-5">
          <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2"><CheckCircle className="h-4 w-4" aria-hidden="true" />Promoted to startup</p>
          <div className="flex flex-wrap gap-3">
            <Link to={`/team-workspace/${registration.teamId}`} className="text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">Open workspace</Link>
            <Link to={roleDashboardPath.founder} className="text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">View in portfolio</Link>
          </div>
        </div>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={() => setPromoteOpen(true)}
            className="text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all">
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
    <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-2 mb-4">
        <Lock className="w-4 h-4 text-slate-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Final submission</h3>
        <span className="ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400">Locked</span>
      </div>
      <dl className="space-y-3.5">
        <div>
          <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Summary</dt>
          <dd className="text-sm text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap">{submission.summary}</dd>
        </div>
        {LINKS.map((link) => (
          <div key={link.key}>
            <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{link.label}</dt>
            <dd className="mt-1">
              <a
                href={submission[link.key]}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0066ff] dark:text-[#58a6ff] hover:underline break-all"
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
