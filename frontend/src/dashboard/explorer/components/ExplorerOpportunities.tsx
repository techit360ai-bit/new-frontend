import { useState, useMemo } from "react";
import { Sparkles, DollarSign, PieChart, Clock, Award, Search, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface OpportunityItem {
  id: string;
  title: string;
  startupName: string;
  type: "Co-Founder" | "Paid Gig" | "Bounty" | "Equity Role";
  compStyle: "Cash + Equity" | "Equity Only" | "Bounty Cash";
  compDetails: string;
  commitment: string;
  matchScore: number;
  requiredSkills: string[];
  description: string;
  postedAt: string;
}

const MOCK_OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-1",
    title: "Lead AI Engineer & Technical Co-Founder",
    startupName: "AuraAI",
    type: "Co-Founder",
    compStyle: "Cash + Equity",
    compDetails: "$4,500/mo + 15% Equity (4y vesting)",
    commitment: "Full-Time (40h/wk)",
    matchScore: 97,
    requiredSkills: ["TypeScript", "Python", "LLMs", "System Design"],
    description: "Architect core agentic execution framework and lead our 4-person engineering team.",
    postedAt: "1 day ago"
  },
  {
    id: "opp-2",
    title: "Smart Contract Audit & Micro-Grant Bounty",
    startupName: "Nexus Protocol",
    type: "Bounty",
    compStyle: "Bounty Cash",
    compDetails: "$2,500 USDC Bounty",
    commitment: "Project-Based",
    matchScore: 92,
    requiredSkills: ["Solidity", "Hardhat", "Security Audit"],
    description: "Audit automated vesting vault smart contracts prior to mainnet deployment.",
    postedAt: "3 days ago"
  },
  {
    id: "opp-3",
    title: "Senior React / Three.js Frontend Contributor",
    startupName: "BioSynth AI",
    type: "Paid Gig",
    compStyle: "Cash + Equity",
    compDetails: "$3,800/mo + 2% Equity",
    commitment: "Part-Time (20h/wk)",
    matchScore: 89,
    requiredSkills: ["React", "Three.js", "WebGL", "TypeScript"],
    description: "Build 3D interactive molecular renderer for protein folding candidate web application.",
    postedAt: "Just now"
  }
];

export function ExplorerOpportunities() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeOpp, setActiveOpp] = useState<OpportunityItem | null>(null);

  const types = ["all", "Co-Founder", "Paid Gig", "Bounty", "Equity Role"];

  const filteredOpps = useMemo(() => {
    return MOCK_OPPORTUNITIES.filter((opp) => {
      const matchesSearch =
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === "all" || opp.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ecosystem Opportunities</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Discover verified startup gigs, co-founder roles, bounties, and equity positions matched to your skills.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
              {filteredOpps.length} Positions Available
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
              placeholder="Search opportunity title, startup, skills..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
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
                    ? "bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/25"
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
              className="group relative flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:border-[#0066ff]/40 dark:hover:border-[#58a6ff]/40 hover:shadow-xl gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0066ff] dark:text-[#58a6ff] border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[10px] font-bold">
                    {opp.type}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{opp.startupName}</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-[#20c937]">
                    <Sparkles className="h-3 w-3" />
                    {opp.matchScore}% Fit
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors">
                  {opp.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {opp.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                    {opp.compDetails}
                  </span>
                  <span>• {opp.commitment}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveOpp(opp)}
                  className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#18181b] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{activeOpp.title}</h3>
                  <p className="text-xs text-[#0066ff] dark:text-[#58a6ff] font-bold">{activeOpp.startupName} • {activeOpp.type}</p>
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
                  onClick={() => { alert(`Application submitted for ${activeOpp.title}! The startup team will review your profile.`); setActiveOpp(null); }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md hover:opacity-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Submit Application</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ExplorerLayout>
  );
}
