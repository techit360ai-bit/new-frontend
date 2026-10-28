import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, CheckCircle, Building2 } from "lucide-react";
import { toast } from "sonner";
import type { Opportunity } from "@/dashboard/_shared/opportunities/types";
import { applyToOpportunity, fetchFounderOpportunity } from "@/lib/api/opportunities";

const TYPE_LABEL: Record<Opportunity["type"], string> = {
  hackathon: "HACKATHON",
  program: "PROGRAM",
  funding: "FUNDING",
  event: "EVENT",
  collaboration: "COLLABORATION CALL",
};

export default function OpportunityDetail() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const navigate = useNavigate();
  const [opp, setOpp] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!opportunityId) {
      setLoading(false);
      return;
    }
    fetchFounderOpportunity(opportunityId)
      .then((item) => {
        if (alive) setOpp(item);
      })
      .catch((err) => {
        if (!alive) return;
        setOpp(null);
        setError(err instanceof Error ? err.message : "Live opportunity data is unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [opportunityId]);

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-500">Loading live opportunity...</div>;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-16 border border-rose-500/20 rounded-2xl bg-rose-500/10">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Live opportunity data is unavailable: {error}</p>
        </div>
      </div>
    );
  }

  if (!opp) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-2xl mx-auto text-center py-16 border border-black/[0.06] dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <p className="text-base text-slate-800 dark:text-white font-bold">Opportunity not found</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">The opportunity may have been removed or never existed.</p>
          <Link to="/opportunity-hub" className="inline-block mt-4 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
            ← Back to Opportunity Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/opportunity-hub"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Opportunity Hub
        </Link>

        <div className="border border-black/[0.06] dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-4">
            <span className="text-5xl shrink-0" aria-hidden="true">{opp.poster}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 rounded-lg">
              {TYPE_LABEL[opp.type]}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{opp.title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 flex items-center">
            <Building2 className="mr-1.5 inline-block h-4 w-4 text-slate-400" aria-hidden="true" />
            {opp.organizer.name}
          </p>
          <p className="text-base text-slate-700 dark:text-slate-300 mt-4 leading-relaxed">{opp.summary}</p>

          {opp.type === "hackathon" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10">
              <Detail label="Theme" value={opp.theme} />
              <Detail label="Prize Pool" value={opp.prizePool} />
              <Detail label="Duration" value={`${opp.durationHours} hours`} />
              <Detail label="Dates" value={`${opp.startDate} → ${opp.endDate}`} />
              <Detail label="Registrants" value={opp.registrants.toLocaleString()} />
              <Detail label="Teams formed" value={opp.teamsFormed.toString()} />
              <Detail label="Partners" value={opp.partners.join(", ")} />
            </dl>
          )}
          {opp.type === "program" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10">
              <Detail label="Format" value={opp.format} />
              <Detail label="Duration" value={`${opp.durationWeeks} weeks`} />
              <Detail label="Cohort size" value={opp.cohortSize.toString()} />
              <Detail label="Starts" value={opp.startDate} />
              <Detail label="Perks" value={opp.perks.join(", ")} />
            </dl>
          )}
          {opp.type === "funding" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10">
              <Detail label="Format" value={opp.format} />
              <Detail label="Amount" value={opp.amountRange} />
              <Detail label="Equity required" value={opp.equityRequired ? "Yes" : "No"} />
              <Detail label="Stages eligible" value={opp.audienceStage.join(", ")} />
            </dl>
          )}
          {opp.type === "event" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10">
              <Detail label="Format" value={opp.format} />
              <Detail label="Starts" value={opp.startDate} />
              <Detail label="Duration" value={`${opp.durationMinutes} min`} />
              <Detail label="Hosted by" value={opp.hostedBy} />
              <Detail label="Mode" value={opp.isVirtual ? "Virtual" : "In person"} />
            </dl>
          )}
          {opp.type === "collaboration" && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-black/[0.06] dark:border-white/10">
              <Detail label="Role" value={opp.role} />
              <Detail label="Ownership proposed" value={opp.equityPercent > 0 ? `${opp.equityPercent}%` : "None (cash-only exception)"} />
              <Detail label="Commitment" value={opp.timeCommitment} />
              <Detail label="Cash support" value={opp.cashCompMonthly > 0 ? `$${opp.cashCompMonthly.toLocaleString()}/month` : "Not included"} />
              <Detail label="Skills" value={opp.skills.join(", ")} />
              <Detail label="Audience" value={opp.audienceRoles.join(", ")} />
              <div className="col-span-1 sm:col-span-2"><Detail label="Scope" value={opp.scope} /></div>
            </dl>
          )}

          <div className="flex flex-wrap gap-2 mt-6">
            {opp.tags.map((t) => (
              <span key={t} className="text-[11px] font-medium bg-black/[0.03] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                {t}
              </span>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Apply by {opp.applyDeadline}</span>
            {opp.type === "hackathon" ? (
              <button
                type="button"
                onClick={() => navigate(`/incubation-hub?panel=hackathon&h=${opp.id}&stage=register`)}
                className="text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
              >
                Register team →
              </button>
            ) : applied ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle className="h-4 w-4" aria-hidden="true" /> Applied
              </span>
            ) : (
              <button
                type="button"
                disabled={applying}
                onClick={async () => {
                  if (!opp.id) return;
                  setApplying(true);
                  try {
                    await applyToOpportunity(opp.id, `Applying to ${opp.title}`);
                    setApplied(true);
                    toast.success("Application submitted!");
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : "Application failed";
                    if (msg.includes("already_applied")) {
                      setApplied(true);
                      toast.info("You have already applied");
                    } else {
                      toast.error(msg);
                    }
                  } finally {
                    setApplying(false);
                  }
                }}
                className="text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-50"
              >
                {applying ? "Submitting..." : opp.type === "event" ? "RSVP →" : "Apply →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">{label}</dt>
      <dd className="text-sm text-slate-900 dark:text-white font-medium mt-0.5">{value}</dd>
    </div>
  );
}
