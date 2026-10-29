import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ExplorerDataState, useExplorerRecommendations, explorerDestination } from "../useExplorerRecommendations";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Building2, Rocket, Users, ShieldCheck, ExternalLink, ArrowRight, Zap, Award } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface StartupItem {
  href: string;
  id: string;
  name: string;
  oneLiner: string;
  stage: string;
  sector: string;
  teamSize: string;
  openRolesCount: string;
  funding: string;
  logoEmoji: string;
  tags: string[];
}


export function ExplorerStartups() {
  const navigate = useNavigate();
  const { rows, loading, error, retry } = useExplorerRecommendations("startup");
  const startups: StartupItem[] = useMemo(() => rows.map(({ entity: e }) => ({ id: e.entityId, href: explorerDestination(e.url), name: e.title, oneLiner: e.description || e.subtitle || '', stage: e.stage || 'Not specified', sector: e.industries?.join(', ') || 'Not specified', teamSize: 'Not available', openRolesCount: 'Not available', funding: 'Not disclosed', logoEmoji: e.title.slice(0, 1), tags: e.skills || [] })), [rows]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [activeStartup, setActiveStartup] = useState<StartupItem | null>(null);

  const stages = ["all", "Idea", "MVP", "Beta", "Launch", "Growth"];

  const filteredStartups = useMemo(() => {
    return startups.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.oneLiner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === "all" || s.stage === selectedStage;

      return matchesSearch && matchesStage;
    });
  }, [startups, searchQuery, selectedStage]);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        <ExplorerDataState loading={loading} error={error} empty={filteredStartups.length === 0} retry={retry} />
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Startup Showcase</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover early-stage startups building innovative solutions across the TechIT ecosystem.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20">
              {filteredStartups.length} Startups Active
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
              placeholder="Search startup name, sector, tech stack..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">Stage:</span>
            {stages.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStage(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStage === st
                    ? "bg-[#20C997] text-slate-950 shadow-md shadow-[#20C997]/25"
                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {st === "all" ? "All Stages" : st}
              </button>
            ))}
          </div>
        </div>

        {/* Startups Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStartups.map((s) => (
            <div
              key={s.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#20C997]/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 text-2xl shadow-sm">
                      {s.logoEmoji}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                        {s.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block">{s.sector}</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 px-2.5 py-0.5 text-[10px] font-bold">
                    {s.stage}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{s.oneLiner}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Funding</span>
                  <span className="font-bold text-slate-900 dark:text-white">{s.funding}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveStartup(s)}
                  className="inline-flex items-center gap-1 font-bold text-[#20C997] hover:underline"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Startup Detail Modal */}
        {activeStartup && (
          <Dialog open onOpenChange={open => { if (!open) setActiveStartup(null); }}><DialogContent aria-describedby={undefined} className="max-w-lg border-0 bg-transparent p-0 shadow-none"><DialogTitle className="sr-only">{activeStartup.name}</DialogTitle>
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 text-3xl">
                    {activeStartup.logoEmoji}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{activeStartup.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{activeStartup.sector} • {activeStartup.funding}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStartup(null)}
                  className="rounded-xl border border-black/[0.06] dark:border-white/10 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeStartup.oneLiner}
              </p>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Team Size</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeStartup.teamSize} Members</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Open Roles</span>
                  <span className="font-bold text-[#20C997]">{activeStartup.openRolesCount} Recruiting</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/[0.06] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveStartup(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {

                    setActiveStartup(null);
                    navigate(activeStartup.href);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all"
                >
                  View Startup
                </button>
              </div>
            </div>
          </DialogContent></Dialog>
        )}
      </div>
    </ExplorerLayout>
  );
}
