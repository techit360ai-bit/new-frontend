import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ExplorerDataState, useExplorerRecommendations, explorerDestination } from "../useExplorerRecommendations";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, DollarSign, PieChart, Clock, Award, Search, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface OpportunityItem {
  href: string;
  id: string;
  title: string;
  startupName: string;
  type: string;
  compStyle: string;
  compDetails: string;
  commitment: string;
  matchScore: number;
  requiredSkills: string[];
  description: string;
  postedAt: string;
}


export function ExplorerOpportunities() {
  const navigate = useNavigate();
  const { rows, loading, error, retry } = useExplorerRecommendations("opportunity");
  const opportunities: OpportunityItem[] = useMemo(() => rows.map(({ entity: e, score }) => ({ id: e.entityId, href: explorerDestination(e.url), title: e.title, startupName: e.subtitle || 'Not specified', type: 'Opportunity', compStyle: 'Not disclosed', compDetails: 'See opportunity details', commitment: 'See opportunity details', matchScore: score, requiredSkills: e.skills || [], description: e.description || '', postedAt: 'Published opportunity' })), [rows]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeOpp, setActiveOpp] = useState<OpportunityItem | null>(null);

  const types = ["all", "Opportunity"];

  const filteredOpps = useMemo(() => {
    return opportunities.filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "all" || opp.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [opportunities, searchQuery, selectedType]);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        <ExplorerDataState loading={loading} error={error} empty={filteredOpps.length === 0} retry={retry} />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ecosystem Opportunities</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover verified startup gigs, co-founder roles, bounties, and equity positions matched to your skills.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20">
              {filteredOpps.length} Positions Available
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-4 backdrop-blur-xl space-y-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunity title, startup, skills..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">Type:</span>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedType === t
                    ? "bg-[#20C997] text-slate-950 shadow-md shadow-[#20C997]/25"
                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {t === "all" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities List */}
        <div className="space-y-4">
          {filteredOpps.map((opp) => (
            <div
              key={opp.id}
              className="group relative flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:border-[#20C997]/40 hover:shadow-xl gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 px-2.5 py-0.5 text-[10px] font-bold">
                    {opp.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{opp.startupName}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#20C997]/20 bg-[#20C997]/10 px-2 py-0.5 text-[10px] font-bold text-[#20C997]">
                    <Sparkles className="h-3 w-3" />
                    {opp.matchScore}% Fit
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                  {opp.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {opp.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-[#20C997]" />
                    {opp.compDetails}
                  </span>
                  <span>• {opp.commitment}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveOpp(opp)}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Apply Now</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Application Modal */}
        {activeOpp && (
          <Dialog open onOpenChange={open => { if (!open) setActiveOpp(null); }}><DialogContent aria-describedby={undefined} className="max-w-lg border-0 bg-transparent p-0 shadow-none"><DialogTitle className="sr-only">{activeOpp.title}</DialogTitle>
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{activeOpp.title}</h3>
                  <p className="text-xs text-[#20C997] font-bold">{activeOpp.startupName} • {activeOpp.type}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveOpp(null)}
                  className="rounded-xl border border-black/[0.06] dark:border-white/10 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] text-xs space-y-1">
                <p className="font-bold text-slate-900 dark:text-white">Compensation: {activeOpp.compDetails}</p>
                <p className="text-slate-500 dark:text-slate-400">Commitment: {activeOpp.commitment}</p>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeOpp.description}
              </p>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/[0.06] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveOpp(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {

                    setActiveOpp(null);
                    navigate(activeOpp.href);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>View Opportunity</span>
                </button>
              </div>
            </div>
          </DialogContent></Dialog>
        )}
      </div>
    </ExplorerLayout>
  );
}
