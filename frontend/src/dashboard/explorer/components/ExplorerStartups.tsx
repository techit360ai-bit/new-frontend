import { useState, useMemo } from "react";
import { Search, Building2, Rocket, Users, ShieldCheck, ExternalLink, ArrowRight, Zap, Award } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface StartupItem {
  id: string;
  name: string;
  oneLiner: string;
  stage: "Idea" | "MVP" | "Beta" | "Launch" | "Growth";
  sector: string;
  teamSize: number;
  openRolesCount: number;
  funding: string;
  logoEmoji: string;
  tags: string[];
}

const MOCK_STARTUPS: StartupItem[] = [
  {
    id: "st-1",
    name: "AuraAI",
    oneLiner: "Autonomous AI Agent suite for automated code reviews and vulnerability detection.",
    stage: "Beta",
    sector: "AI & Developer Tools",
    teamSize: 6,
    openRolesCount: 3,
    funding: "$1.2M Pre-Seed",
    logoEmoji: "⚡",
    tags: ["Rust", "TypeScript", "LLM Fine-Tuning"]
  },
  {
    id: "st-2",
    name: "Nexus Protocol",
    oneLiner: "On-chain revenue share and milestone-based equity distribution smart contracts.",
    stage: "MVP",
    sector: "Fintech & Web3",
    teamSize: 4,
    openRolesCount: 2,
    funding: "Bootstrapped",
    logoEmoji: "🌐",
    tags: ["Solidity", "React", "Zero Knowledge"]
  },
  {
    id: "st-3",
    name: "BioSynth AI",
    oneLiner: "Generative protein engineering models for targeted therapeutics discovery.",
    stage: "Launch",
    sector: "DeepTech / Biotech",
    teamSize: 12,
    openRolesCount: 4,
    funding: "$3.5M Seed",
    logoEmoji: "🧬",
    tags: ["PyTorch", "Biophysics", "GenAI"]
  },
  {
    id: "st-4",
    name: "HyperScale Cloud",
    oneLiner: "Edge micro-datacenter orchestration engine for ultra-low latency compute.",
    stage: "Growth",
    sector: "Cloud Infrastructure",
    teamSize: 18,
    openRolesCount: 5,
    funding: "$8.0M Series A",
    logoEmoji: "☁️",
    tags: ["Go", "Kubernetes", "eBPF"]
  },
  {
    id: "st-5",
    name: "EcoTrack Network",
    oneLiner: "Real-time carbon footprint verification and ESG compliance reporting.",
    stage: "Idea",
    sector: "ClimateTech",
    teamSize: 2,
    openRolesCount: 1,
    funding: "Grant Funded",
    logoEmoji: "🌱",
    tags: ["Python", "IoT", "React Native"]
  }
];

export function ExplorerStartups() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [activeStartup, setActiveStartup] = useState<StartupItem | null>(null);

  const stages = ["all", "Idea", "MVP", "Beta", "Launch", "Growth"];

  const filteredStartups = useMemo(() => {
    return MOCK_STARTUPS.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.oneLiner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sector.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = selectedStage === "all" || s.stage === selectedStage;

      return matchesSearch && matchesStage;
    });
  }, [searchQuery, selectedStage]);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Startup Showcase</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover early-stage startups building innovative solutions across the TechIT ecosystem.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
              {filteredStartups.length} Startups Active
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-4 backdrop-blur-xl space-y-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search startup name, sector, tech stack..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
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
                    ? "bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/25"
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
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0066ff]/40 dark:hover:border-[#58a6ff]/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-white/10 dark:to-white/5 text-2xl shadow-sm">
                      {s.logoEmoji}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors">
                        {s.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block">{s.sector}</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0066ff] dark:text-[#58a6ff] border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
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
                  className="inline-flex items-center gap-1 font-bold text-[#0066ff] dark:text-[#58a6ff] hover:underline"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#18181b] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-white/10 text-3xl">
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
                  <span className="font-bold text-[#0066ff] dark:text-[#58a6ff]">{activeStartup.openRolesCount} Recruiting</span>
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
                  onClick={() => { alert(`Navigating to open positions for ${activeStartup.name}...`); setActiveStartup(null); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md hover:opacity-95"
                >
                  Explore Open Roles
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ExplorerLayout>
  );
}
