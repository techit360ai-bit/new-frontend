import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import type { Opportunity } from "@/dashboard/_shared/opportunities/types";

interface Props {
  opportunity: Opportunity;
  variant?: "featured" | "grid";
}

const TYPE_LABEL: Record<Opportunity["type"], string> = {
  hackathon: "HACKATHON",
  program: "PROGRAM",
  funding: "FUNDING",
  event: "EVENT",
  collaboration: "COLLABORATION CALL",
};

const STATUS_STYLES = {
  open: { bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", label: "Open" },
  "closing-soon": { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", label: "Closing soon" },
  closed: { bg: "bg-slate-500/10", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500/20", label: "Closed" },
};

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - new Date().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function countdown(iso: string): string {
  const days = daysUntil(iso);
  if (days < 0) return "Closed";
  if (days === 0) return "Closes today";
  if (days === 1) return "Closes tomorrow";
  return `Closes in ${days} days`;
}

function metricLine(opp: Opportunity): string {
  switch (opp.type) {
    case "hackathon":
      return `${opp.prizePool} · ${opp.durationHours}h · ${opp.registrants.toLocaleString()} registered`;
    case "program":
      return `${opp.format} · ${opp.durationWeeks} weeks · Cohort ${opp.cohortSize}`;
    case "funding":
      return `${opp.amountRange} · ${opp.equityRequired ? "Equity" : "Non-dilutive"}`;
    case "event":
      return `${opp.format} · ${opp.durationMinutes}min · ${opp.isVirtual ? "Virtual" : opp.hostedBy}`;
    case "collaboration": {
      const ownership = opp.equityPercent > 0 ? `${opp.equityPercent}% ownership proposed` : "Cash-only offer";
      return `${opp.role} · ${opp.timeCommitment} · ${ownership}`;
    }
  }
}

function ctaLabel(opp: Opportunity): string {
  switch (opp.type) {
    case "hackathon": return "Register team →";
    case "program":
    case "funding":   return "Apply →";
    case "event":     return "RSVP →";
    case "collaboration": return "Express interest →";
  }
}

function ctaTarget(opp: Opportunity): string {
  if (opp.type === "hackathon") {
    return `/incubation-hub?panel=hackathon&h=${opp.id}&stage=register`;
  }
  return `/opportunity-hub/${opp.id}`;
}

export function OpportunityCard({ opportunity, variant = "grid" }: Props) {
  const navigate = useNavigate();
  const status = STATUS_STYLES[opportunity.status];
  const isFeatured = variant === "featured";

  return (
    <article
      className={`border border-black/[0.06] dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col hover:border-[#0066ff]/30 transition-all group ${
        isFeatured ? "h-full" : ""
      }`}
    >
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="text-3xl shrink-0" aria-hidden="true">{opportunity.poster}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 rounded-lg">
            {TYPE_LABEL[opportunity.type]}
          </span>
        </div>
        <h3 className={`font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors ${isFeatured ? "text-xl sm:text-2xl" : "text-base"} mb-1`}>
          {opportunity.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center">
          <Building2 className="mr-1.5 inline-block h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          {opportunity.organizer.name}
        </p>
        <p className={`text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed ${isFeatured ? "" : "line-clamp-2"}`}>
          {opportunity.summary}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 font-medium">{metricLine(opportunity)}</p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-3.5 border-t border-black/[0.06] dark:border-white/10">
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2.5 py-0.5 rounded-lg border ${status.bg} ${status.text} ${status.border} font-semibold text-[11px]`}>
              {status.label}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">{countdown(opportunity.applyDeadline)}</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(ctaTarget(opportunity))}
            className="text-xs font-bold px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_12px_rgba(0,102,255,0.25)] transition-all"
          >
            {ctaLabel(opportunity)}
          </button>
        </div>
      </div>
    </article>
  );
}
