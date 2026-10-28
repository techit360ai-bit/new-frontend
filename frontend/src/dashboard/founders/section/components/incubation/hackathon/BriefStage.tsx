import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import type { HackathonRegistration, IdeaBrief } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { momentumColor } from "@/dashboard/_shared/hackathon/momentum";
import { submitHackathonBrief } from "@/lib/api/hackathon";

interface Props {
  registration: HackathonRegistration;
}

const FIELDS: { key: keyof Omit<IdeaBrief, "submittedAt">; label: string; helper: string }[] = [
  { key: "problem",        label: "Problem",         helper: "What specific pain are you solving, and for whom?" },
  { key: "targetUser",     label: "Target user",     helper: "Who exactly feels this? Be concrete." },
  { key: "solutionSketch", label: "Solution sketch", helper: "What will you actually build? Outline the core flow." },
  { key: "whyNow",         label: "Why now",         helper: "What changed recently that makes this the moment?" },
  { key: "differentiator", label: "Differentiator",  helper: "What makes this unlike existing alternatives?" },
  { key: "risk",           label: "Biggest risk",    helper: "What's most likely to sink this — and your hedge?" },
  { key: "successMetric",  label: "Success metric",  helper: "How will you know it worked? Add a number or timeframe." },
];

const MIN_CHARS = 20;
const SUB_SCORES: { key: "problemClarity" | "innovationGap" | "initialImpact"; label: string }[] = [
  { key: "problemClarity", label: "Problem Clarity" },
  { key: "innovationGap",  label: "Innovation Gap" },
  { key: "initialImpact",  label: "Initial Impact" },
];

const EMPTY: Record<string, string> = {
  problem: "", targetUser: "", solutionSketch: "", whyNow: "", differentiator: "", risk: "", successMetric: "",
};

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = momentumColor(score);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className={`text-xs font-semibold ${color.text}`}>{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div className={`h-1.5 rounded-full ${color.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export function BriefStage({ registration }: Props) {
  const [, setSearchParams] = useSearchParams();
  const { registerForHackathon } = useFounderProfile();
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const locked = !!registration.brief;

  const goToBuild = () => {
    const next = new URLSearchParams();
    next.set("panel", "hackathon");
    next.set("stage", "build");
    setSearchParams(next, { replace: true });
  };

  // ---- Post-submit locked view ----
  if (locked && registration.brief) {
    const brief = registration.brief;
    const score = registration.briefScore;
    const color = score ? momentumColor(score.overall) : null;
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-slate-400" />
            <h2 className="text-base font-bold text-[#171330] dark:text-white">Idea brief — submitted</h2>
            <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 font-medium">Locked</span>
          </div>
          <dl className="space-y-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <dt className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{f.label}</dt>
                <dd className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">{brief[f.key]}</dd>
              </div>
            ))}
          </dl>
        </div>

        {score && color ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-6 space-y-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#171330] dark:text-white">Persisted assessment</h3>
              <span className={`text-2xl font-black ${color.text}`}>{score.overall}</span>
            </div>
            {SUB_SCORES.map((s) => (
              <div key={s.key} className="space-y-2">
                <ScoreBar score={score[s.key]} label={s.label} />
                <ul className="space-y-1 pl-1">
                  {score.critiques[s.key].map((c, i) => (
                    <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex gap-1.5">
                      <span className="text-slate-300 dark:text-slate-600">•</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300">Assessment pending</h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              Your brief is persisted. Scores will appear after the judging service records them.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={goToBuild}
            className="inline-flex items-center gap-1.5 text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            Continue to Build <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ---- Pre-submit form ----
  const allValid = FIELDS.every((f) => values[f.key].trim().length >= MIN_CHARS);

  const handleSubmit = async () => {
    if (!allValid) return;
    const brief: IdeaBrief = {
      problem: values.problem.trim(),
      targetUser: values.targetUser.trim(),
      solutionSketch: values.solutionSketch.trim(),
      whyNow: values.whyNow.trim(),
      differentiator: values.differentiator.trim(),
      risk: values.risk.trim(),
      successMetric: values.successMetric.trim(),
      submittedAt: new Date().toISOString(),
    };
    setSubmitting(true);
    try {
      const result = await submitHackathonBrief(registration.hackathonId, {
        teamId: registration.teamId,
        problem: brief.problem,
        solution: brief.solutionSketch,
        fields: brief,
      });
      if (!result.ok || !result.registration) {
        toast.error("The brief was not persisted.");
        return;
      }
      registerForHackathon(result.registration);
      toast.success("Brief submitted — Build stage unlocked");
      goToBuild();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The brief could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-5">
        <h2 className="text-base font-bold text-[#171330] dark:text-white">Submit your idea brief</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Seven fields, each at least {MIN_CHARS} characters. The brief locks on submit — make it count.
        </p>
      </div>

      <div className="space-y-5">
        {FIELDS.map((f) => {
          const val = values[f.key];
          const ok = val.trim().length >= MIN_CHARS;
          return (
            <div key={f.key}>
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200">{f.label}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{f.helper}</p>
              <textarea
                rows={3}
                value={val}
                onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full text-sm border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-xl px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-colors"
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${ok ? "text-slate-400" : "text-amber-500 font-semibold"}`}>
                  {val.trim().length}/{MIN_CHARS} min
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          disabled={!allValid || submitting}
          onClick={() => void handleSubmit()}
          className={`text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
            allValid
              ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]"
              : "bg-black/[0.04] dark:bg-white/[0.04] text-slate-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Submitting..." : "Submit brief"}
        </button>
      </div>
    </div>
  );
}
