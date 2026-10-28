import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Filter, Sparkles, Building2, Users, FolderKanban, Award, ChevronRight, ExternalLink, ArrowUpRight } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface NetworkEntity {
  id: string;
  type: "startup" | "founder" | "collaborator" | "project" | "mentor";
  name: string;
  tagline: string;
  category: string;
  location: string;
  matchScore: number;
  tags: string[];
  avatarEmoji?: string;
  metrics?: { label: string; value: string };
}

const MOCK_ENTITIES: NetworkEntity[] = [
  {
    id: "1",
    type: "startup",
    name: "AuraAI",
    tagline: "Autonomous Agentic Code Review & Security Sentinel",
    category: "AI & DevTools",
    location: "San Francisco, CA",
    matchScore: 98,
    tags: ["TypeScript", "Python", "LLMs", "Rust"],
    avatarEmoji: "⚡",
    metrics: { label: "Stage", value: "MVP / Beta" }
  },
  {
    id: "2",
    type: "project",
    name: "Nexus Protocol",
    tagline: "Decentralized Micro-Equity vesting contract framework",
    category: "Fintech & Web3",
    location: "Remote / Global",
    matchScore: 94,
    tags: ["Solidity", "React", "Zero Knowledge"],
    avatarEmoji: "🌐",
    metrics: { label: "Recruiting", value: "2 Developers" }
  },
  {
    id: "3",
    type: "founder",
    name: "Elena Rostova",
    tagline: "Serial Founder building next-gen developer productivity suite",
    category: "SaaS / Founder",
    location: "Austin, TX",
    matchScore: 91,
    tags: ["Product Strategy", "Go-To-Market", "B2B SaaS"],
    avatarEmoji: "👩‍💻",
    metrics: { label: "Looking For", value: "Technical Co-Founder" }
  },
  {
    id: "4",
    type: "collaborator",
    name: "David Kalu",
    tagline: "Senior Full-Stack & Smart Contract Engineer",
    category: "Engineer",
    location: "London, UK",
    matchScore: 89,
    tags: ["React", "Node.js", "GraphQL", "Docker"],
    avatarEmoji: "🛠️",
    metrics: { label: "Availability", value: "20 hrs/week" }
  },
  {
    id: "5",
    type: "mentor",
    name: "Marcus Vance",
    tagline: "Ex-VP Engineering @ Stripe. Angel investor in dev tools.",
    category: "Advisor",
    location: "New York, NY",
    matchScore: 95,
    tags: ["Scaling", "Architecture", "Fundraising"],
    avatarEmoji: "🏆",
    metrics: { label: "Office Hours", value: "Thursdays" }
  },
  {
    id: "6",
    type: "startup",
    name: "BioSynth AI",
    tagline: "Generative protein engineering models for biotech research",
    category: "DeepTech / Biotech",
    location: "Boston, MA",
    matchScore: 88,
    tags: ["PyTorch", "Bioinformatics", "GenAI"],
    avatarEmoji: "🧬",
    metrics: { label: "Stage", value: "Seed / Launch" }
  }
];

export function ExplorerDiscover() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedEntity, setSelectedEntity] = useState<NetworkEntity | null>(null);

  const filteredEntities = useMemo(() => {
    return MOCK_ENTITIES.filter((entity) => {
      const matchesSearch =
        entity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entity.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = selectedType === "all" || entity.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const typePills = [
    { id: "all", label: "All Entities" },
    { id: "startup", label: "Startups" },
    { id: "project", label: "Build Projects" },
    { id: "founder", label: "Founders" },
    { id: "collaborator", label: "Collaborators" },
    { id: "mentor", label: "Mentors" },
  ];

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ecosystem Discovery</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search and filter verified founders, startups, projects, and experts across the network.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20">
              {filteredEntities.length} Matches Found
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-4 backdrop-blur-xl space-y-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, tech stack, category, or location..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10"
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {typePills.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedType(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedType === pill.id
                    ? "bg-[#20C997] text-slate-950 shadow-md shadow-[#20C997]/25"
                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Discovery Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEntities.map((entity) => (
            <div
              key={entity.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#20C997]/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#20C997]/10 text-[#20C997] text-xl shadow-sm border border-[#20C997]/20">
                      {entity.avatarEmoji || "🚀"}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                        {entity.name}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 block">
                        {entity.category} • {entity.location}
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-full border border-[#20C997]/20 bg-[#20C997]/10 px-2 py-0.5 text-[10px] font-bold text-[#20C997]">
                    <Sparkles className="h-3 w-3" />
                    {entity.matchScore}% Match
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {entity.tagline}
                </p>

                {/* Tech / Skill Chips */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {entity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between">
                {entity.metrics && (
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{entity.metrics.label}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{entity.metrics.value}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedEntity(entity)}
                  className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-[#20C997] hover:underline"
                >
                  <span>Inspect</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Entity Detail Drawer Modal */}
        {selectedEntity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#20C997]/10 text-[#20C997] text-2xl border border-[#20C997]/20">
                    {selectedEntity.avatarEmoji || "🚀"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">{selectedEntity.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{selectedEntity.category} • {selectedEntity.location}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="rounded-xl border border-black/[0.06] dark:border-white/10 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedEntity.tagline}
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Relevant Tags & Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEntity.tags.map((t) => (
                    <span key={t} className="rounded-lg bg-[#20C997]/10 border border-[#20C997]/20 px-2.5 py-1 text-xs font-semibold text-[#20C997]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/[0.06] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedEntity(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success(`Connection request sent to ${selectedEntity.name}!`);
                    setSelectedEntity(null);
                    navigate("/feed/messages");
                  }}
                  className="px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all"
                >
                  Connect in Messages
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ExplorerLayout>
  );
}
