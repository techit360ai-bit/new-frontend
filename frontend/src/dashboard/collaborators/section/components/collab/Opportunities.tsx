import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Sparkles, Building, ArrowUpRight, CheckCircle2, ShieldAlert, Users, Zap, Briefcase } from "lucide-react";
import {
  applyToOpportunity,
  fetchCollaboratorOpportunities,
  patchCollaboratorOpportunityStatus,
  type CollaboratorOpportunity,
} from "@/lib/api/opportunities";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

type Filter = "all" | CollaboratorOpportunity["type"];
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All Opportunities" },
  { value: "project", label: "Projects" },
  { value: "advisory", label: "Advisory" },
  { value: "gig", label: "Gigs" },
  { value: "testing", label: "Testing" },
  { value: "collaboration", label: "Collaboration Calls" },
];

export function Opportunities() {
  const [opps, setOpps]   = useState<CollaboratorOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [detail, setDetail] = useState<CollaboratorOpportunity | null>(null);

  const loadOpportunities = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const rows = await fetchCollaboratorOpportunities();
      setOpps(rows);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to load opportunities.";
      setError(message);
      toast.error("Could not load live opportunities");
      return false;
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadOpportunities();
  }, [loadOpportunities]);

  const visible = filter === "all" ? opps : opps.filter((o) => o.type === filter);

  const handleInterest = async (id: string) => {
    const o = opps.find((x) => x.id === id);
    if (!o) return;
    try {
      if (o.type === "collaboration") {
        await applyToOpportunity(id, `Interested in contributing as ${o.title}.`);
        setOpps((cur) => cur.map((row) => row.id === id ? { ...row, status: "applied" } : row));
      } else {
        const updated = await patchCollaboratorOpportunityStatus(id, "applied");
        setOpps((cur) => cur.map((row) => row.id === id ? updated : row));
      }
      toast.success(`Application sent to ${o.company}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update opportunity status.";
      if (message.includes("already_applied")) {
        setOpps((cur) => cur.map((row) => row.id === id ? { ...row, status: "applied" } : row));
        toast.info("You already expressed interest in this call.");
      } else {
        toast.error(message);
      }
    }
  };

  const handlePass = async (id: string) => {
    const removed = opps.find((o) => o.id === id);
    if (!removed) return;
    if (removed.type === "collaboration") {
      setOpps((cur) => cur.filter((o) => o.id !== id));
      toast("Removed from this view");
      return;
    }
    try {
      await patchCollaboratorOpportunityStatus(id, "passed");
      setOpps((cur) => cur.filter((o) => o.id !== id));
      toast("Removed", {
        action: {
          label: "Undo",
          onClick: () => {
            void patchCollaboratorOpportunityStatus(id, "open").then((updated) => {
              setOpps((cur) => [...cur, updated]);
            });
          },
        },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update opportunity status.");
    }
  };

  const handleRefresh = () => {
    void loadOpportunities(true).then((ok) => {
      if (ok) toast("Matches updated");
    });
  };

  const compLabel = (o: CollaboratorOpportunity): string => {
    const parts: string[] = [];
    if (o.equityPercent > 0)    parts.push(`${o.equityPercent}% ownership proposed`);
    if (o.cashCompMonthly > 0)  parts.push(`$${o.cashCompMonthly.toLocaleString()}/mo support`);
    if (o.cashCompOneTime > 0)  parts.push(`$${o.cashCompOneTime.toLocaleString()} one-time support`);
    return parts.join(" + ") || "Ownership proposal to be agreed";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Startup Opportunities</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Matched against your technical stack, equity preference, and availability.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="h-10 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-[#181818] border border-black/[0.08] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#0066ff] ${refreshing ? "animate-spin" : ""}`} />
          <span>Refresh Matches</span>
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              filter === f.value
                ? "border-[#0066ff] bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] shadow-sm"
                : "border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 text-slate-600 dark:text-slate-400 hover:border-black/20 dark:hover:border-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {loading && (
          <div className="col-span-3 text-center py-12 text-xs text-slate-500 dark:text-slate-400">
            <div className="w-5 h-5 border-2 border-[#0066ff] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading live opportunities...
          </div>
        )}

        {!loading && error && (
          <div className="col-span-3 border border-red-500/20 bg-red-50/80 dark:bg-red-950/30 rounded-2xl p-6 text-center">
            <p className="text-sm font-bold text-red-700 dark:text-red-400">Live opportunities are unavailable.</p>
            <p className="text-xs text-red-600 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={() => void loadOpportunities(true)}
              className="mt-3 text-xs px-3.5 py-1.5 border border-red-500/30 rounded-xl text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 font-semibold"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && visible.length === 0 && (
          <div className="col-span-3 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-[#121212]/40">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
            No live opportunities in this category currently match your filter.
          </div>
        )}

        {!loading && !error && visible.map((o) => {
          const applied = o.status === "applied";
          return (
            <div
              key={o.id}
              className={`bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all ${
                applied
                  ? "border-[#20c937]/30 bg-emerald-500/[0.03]"
                  : "border-black/[0.06] dark:border-white/10 hover:border-[#0066ff]/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
                      {o.type}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2">{o.title}</h3>
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{o.company}</span>
                    </p>
                  </div>
                  {o.matchScore > 0 && (
                    <span className="text-xs font-black text-[#20c937] bg-[#20c937]/10 px-2.5 py-1 rounded-full border border-[#20c937]/20 tabular-nums shrink-0">
                      {o.matchScore}% Fit
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04] mb-3.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{compLabel(o)}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {o.skills.map((s) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 mb-5 border-t border-black/[0.04] dark:border-white/[0.06] pt-3">
                  <p>Commitment: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.timeCommitment}</span></p>
                  <p>Team: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.teamQuality}</span> · Risk: <span className="font-semibold text-slate-700 dark:text-slate-300">{o.riskLevel}</span></p>
                </div>
              </div>

              {applied ? (
                <div className="text-xs text-[#20c937] font-bold py-2 px-3 rounded-xl bg-[#20c937]/10 border border-[#20c937]/20 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Application Submitted</span>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-black/[0.06] dark:border-white/10">
                  <button
                    onClick={() => setDetail(o)}
                    className="flex-1 text-xs font-semibold px-3 py-2 border border-black/[0.08] dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => void handleInterest(o.id)}
                    className="flex-1 text-xs font-bold px-3 py-2 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white rounded-xl shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
                  >
                    Express Interest
                  </button>
                  <button
                    onClick={() => void handlePass(o.id)}
                    className="text-xs font-semibold px-2.5 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors"
                  >
                    Pass
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="sm:max-w-lg bg-white/95 dark:bg-[#121212]/95 backdrop-blur-2xl border-l border-black/[0.08] dark:border-white/10 p-6 overflow-y-auto">
          {detail && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff]">
                    {detail.type}
                  </span>
                </div>
                <SheetTitle className="text-xl font-black text-slate-900 dark:text-white">{detail.title}</SheetTitle>
                <SheetDescription className="text-xs font-semibold text-slate-600 dark:text-slate-300">{detail.company}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5 text-xs">
                <div>
                  <p className="uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">Overview</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-white/[0.03] p-3.5 rounded-xl border border-black/[0.03] dark:border-white/[0.04]">
                    {detail.description}
                  </p>
                </div>

                <div>
                  <p className="uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">Proposed Compensation</p>
                  <p className="text-slate-900 dark:text-white font-bold p-3 rounded-xl bg-[#0066ff]/10 border border-[#0066ff]/20">
                    {compLabel(detail)}
                  </p>
                </div>

                <div>
                  <p className="uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">Timeline & Milestones</p>
                  <p className="text-slate-700 dark:text-slate-300 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04]">
                    {detail.timeline}
                  </p>
                </div>

                <div>
                  <p className="uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold mb-1.5">Founding Team</p>
                  <ul className="space-y-1.5">
                    {detail.teamBios.map((b) => (
                      <li key={b.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.03] dark:border-white/[0.04] flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white">{b.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">{b.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => { void handleInterest(detail.id); setDetail(null); }}
                  className="w-full h-11 bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all text-xs"
                >
                  Express Interest in Role
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
