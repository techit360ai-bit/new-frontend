import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createInvestorDeal, listInvestorDeals, type DealRoom } from "@/lib/api/investorDeals";

export function DealPipeline() {
  const [deals, setDeals] = useState<DealRoom[]>([]);
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const projectId = params.get("projectId");

  useEffect(() => {
    listInvestorDeals()
      .then((result) => setDeals(result.deals))
      .catch(() => toast.error("Unable to load deal rooms."))
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    if (!projectId) return toast.error("Open a startup from Deal Intelligence to start a Deal Room.");
    try {
      const result = await createInvestorDeal(projectId);
      setDeals((current) => [result.deal, ...current]);
      toast.success("Deal Room created. NDA signature is required before diligence access.");
    } catch {
      toast.error("Unable to create the Deal Room for this relationship.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Investor Deal Pipeline
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Permissioned Pipeline
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Permissioned diligence rooms connected to your active startup investment opportunities
            </p>
          </div>
          <button
            onClick={create}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1cb084] px-4 py-2.5 text-xs font-bold text-slate-950 shadow-sm transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" /> Create Deal Room
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
        {projectId && (
          <div className="rounded-2xl border border-[#20C997]/20 bg-[#20C997]/10 p-4 text-xs sm:text-sm font-medium text-[#20C997]">
            Selected startup relationship: <span className="font-mono font-bold">{projectId}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading deal rooms...
          </div>
        ) : deals.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
              <BriefcaseBusiness className="h-6 w-6 text-[#20C997]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No active Deal Rooms yet</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Request an introduction from a startup profile or Deal Intelligence to open a permissioned diligence room.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                to={`/investor/deals/${deal.id}`}
                className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 transition-all hover:border-[#20C997]/40 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Project {deal.projectId}</h3>
                      <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">{deal.id}</p>
                    </div>
                    <span className="rounded-full border border-[#20C997]/20 bg-[#20C997]/10 px-2.5 py-0.5 text-xs text-[#20C997] font-semibold capitalize">
                      {deal.state}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs pt-4 border-t border-black/[0.04] dark:border-white/5">
                  <span className={deal.ndaSigned ? "text-[#20C997] font-semibold flex items-center gap-1" : "text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1"}>
                    <ShieldCheck className="h-4 w-4" />
                    {deal.ndaSigned ? "NDA Signed" : "NDA Required"}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                    {deal.diligence.completed}/{deal.diligence.total} complete
                    <ArrowRight className="h-3.5 w-3.5 text-[#20C997]" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
