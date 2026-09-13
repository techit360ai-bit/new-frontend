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
    <aside className="mx-4 mt-4 rounded-lg border border-status-info/25 bg-status-info/5 px-4 py-3 text-sm lg:mx-6" aria-label="Next best action">
      <div className="flex items-start gap-3">
        <Brain className="mt-0.5 h-4 w-4 shrink-0 text-status-info" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary">Recommended next step: {next.action.replaceAll("_", " ")}</p>
          <p className="mt-1 text-text-secondary">{next.reason}</p>
          <p className="mt-1 text-xs text-text-muted">Value: {next.expectedValue}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            <span>{next.access === "available" ? "Included in your current access" : `Access: ${next.access.replaceAll("_", " ")}`}</span>
            {next.usageEstimate ? <span>Estimated use: {next.usageEstimate} credits</span> : null}
            {typeof next.availableCredits === "number" ? <span>Credits available: {next.availableCredits}</span> : null}
          </div>
          <Link to={fundingPath(role)} className="mt-2 inline-flex items-center gap-1 font-medium text-status-info hover:underline">
            Review access options <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
        <button type="button" onClick={dismiss} className="shrink-0 rounded p-1 text-text-muted hover:bg-surface-secondary hover:text-text-primary" aria-label="Dismiss recommendation" title="Dismiss recommendation">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
