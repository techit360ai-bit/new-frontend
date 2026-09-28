import { useEffect, useState } from "react";
import { ArrowUpRight, Brain, X } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchNextBestAction } from "@/lib/api/tvce";

type Role = "founder" | "collaborator" | "investor" | "organisation";

interface NextAction {
  action: string;
  reason: string;
  expectedValue: string;
  access: string;
  metering: string;
  usageEstimateRequired: boolean;
  subscriptionRecommendation: boolean;
  availableCredits?: number;
  usageEstimate?: number | null;
  funding?: string;
  freeRemaining?: number | null;
  purchaseGuidance?: { relevant: boolean; whyNow: string; expectedOutcome: string; observedPriorUses: number; observedSuccessRate: number | null; recommendedFunding: string };
}

const DISMISSED_KEY = "techit:next-best-action-note:dismissed";

function fundingPath(role: Role): string {
  return role === "organisation" ? "/org/billing" : "/wallet";
}

export function NextBestActionNote({ role }: { role: Role }) {
  const [next, setNext] = useState<NextAction | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(`${DISMISSED_KEY}:${role}`) === "1");
    } catch {
      setDismissed(false);
    }
    let active = true;
    fetchNextBestAction(role)
      .then((value) => { if (active) setNext(value as NextAction); })
      .catch(() => { if (active) setNext(null); });
    return () => { active = false; };
  }, [role]);

  if (!next || dismissed) return null;
  const needsFunding = next.access !== "available" || next.subscriptionRecommendation || next.metering === "runtime";
  if (!needsFunding) return null;

  const dismiss = () => {
    setDismissed(true);
    try { sessionStorage.setItem(`${DISMISSED_KEY}:${role}`, "1"); } catch { /* storage unavailable */ }
  };

  return (
    <aside className="mx-4 mt-4 rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-md px-5 py-4 shadow-lg lg:mx-6" aria-label="Next best action">
      <div className="flex items-start gap-3.5">
        <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 ring-1 ring-emerald-500/20 shrink-0">
          <Brain className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bricolage text-sm font-semibold text-slate-100">Recommended next step: <span className="text-emerald-400 capitalize">{next.action.replaceAll("_", " ")}</span></p>
          <p className="mt-1 text-sm text-slate-300">{next.reason}</p>
          <p className="mt-1 text-xs text-slate-400">Value: {next.expectedValue}</p>
          {next.purchaseGuidance?.relevant ? <p className="mt-1 text-xs text-slate-400">Why now: {next.purchaseGuidance.whyNow} Expected outcome: {next.purchaseGuidance.expectedOutcome}</p> : null}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="rounded-full bg-slate-800/80 px-2.5 py-0.5 border border-slate-700/60 text-slate-300">{next.access === "available" ? "Included in your current access" : `Access: ${next.access.replaceAll("_", " ")}`}</span>
            {next.usageEstimate ? <span>Estimated use: {next.usageEstimate} credits</span> : null}
            {typeof next.availableCredits === "number" ? <span>Credits available: {next.availableCredits}</span> : null}
          </div>
          <Link to={fundingPath(role)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors">
            Review access options <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors" aria-label="Dismiss recommendation" title="Dismiss recommendation">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
