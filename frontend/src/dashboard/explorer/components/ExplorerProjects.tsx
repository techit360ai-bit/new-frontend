import { useState, useMemo } from "react";
import { FolderKanban, GitBranch, GitCommit, Users, Zap, Search, ArrowUpRight, Code2 } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface BuildProject {
  id: string;
  name: string;
  repoName: string;
  description: string;
  techStack: string[];
  contributorsCount: number;
  commitsCount: number;
  openIssuesCount: number;
  status: "Active Building" | "Sprint Mode" | "Beta Launch";
  updatedAt: string;
}

const MOCK_PROJECTS: BuildProject[] = [
  {
    id: "proj-1",
    name: "Aura Agentic Core",
    repoName: "aura-ai/agentic-core",
    description: "High-performance Rust execution engine for multi-agent LLM task orchestration.",
    techStack: ["Rust", "Tokio", "gRPC", "WebAssembly"],
    contributorsCount: 8,
    commitsCount: 342,
    openIssuesCount: 12,
    status: "Sprint Mode",
    updatedAt: "2 hours ago"
  },
  {
    id: "proj-2",
    name: "Nexus Vesting Contracts",
    repoName: "nexus-protocol/contracts",
    description: "Audited Solidity smart contracts for non-custodial milestone equity vesting.",
    techStack: ["Solidity", "Hardhat", "Foundry", "OpenZeppelin"],
    contributorsCount: 5,
    commitsCount: 184,
    openIssuesCount: 4,
    status: "Active Building",
    updatedAt: "5 hours ago"
  },
  {
    id: "proj-3",
    name: "BioSynth Pipeline UI",
    repoName: "biosynth/pipeline-frontend",
    description: "Interactive 3D molecular visualization dashboard for protein structure candidates.",
    techStack: ["React", "Three.js", "TypeScript", "Tailwind CSS"],
    contributorsCount: 6,
    commitsCount: 210,
    openIssuesCount: 7,
    status: "Beta Launch",
    updatedAt: "1 day ago"
  },
  {
    id: "proj-4",
    name: "HyperScale Edge Mesh",
    repoName: "hyperscale/edge-mesh",
    description: "eBPF-powered network routing layer for global edge computing nodes.",
    techStack: ["Go", "eBPF", "C++", "Docker"],
    contributorsCount: 11,
    commitsCount: 512,
    openIssuesCount: 15,
    status: "Sprint Mode",
    updatedAt: "30 mins ago"
  }
];

export function ExplorerProjects() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTech, setSelectedTech] = useState<string>("all");
  const [activeProject, setActiveProject] = useState<BuildProject | null>(null);

  const techFilters = ["all", "Rust", "TypeScript", "React", "Solidity", "Go", "PyTorch"];

  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.repoName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTech = selectedTech === "all" || p.techStack.includes(selectedTech);

      return matchesSearch && matchesTech;
    });
  }, [searchQuery, selectedTech]);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Active Build Projects</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Explore open build logs, repos, and codebases seeking contributors across the network.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20">
              {filteredProjects.length} Projects Live
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
              placeholder="Search by project name, description, repository..."
              className="h-11 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">Stack:</span>
            {techFilters.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => setSelectedTech(tech)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedTech === tech
                    ? "bg-[#20C997] text-slate-950 shadow-md shadow-[#20C997]/25"
                    : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
                }`}
              >
                {tech === "all" ? "All Stacks" : tech}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#20C997]/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20">
                      <Code2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
                        {p.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 block">{p.repoName}</span>
                    </div>
                  </div>

                  <span className="rounded-full bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 px-2.5 py-0.5 text-[10px] font-bold">
                    {p.status}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{p.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.techStack.map((t) => (
                    <span key={t} className="rounded-lg bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {p.contributorsCount} Team
                  </span>
                  <span className="flex items-center gap-1">
                    <GitCommit className="h-3.5 w-3.5 text-slate-400" />
                    {p.commitsCount} Commits
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveProject(p)}
                  className="inline-flex items-center gap-1 font-bold text-[#20C997] hover:underline text-xs"
                >
                  <span>Inspect Repo</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Project Detail Modal */}
        {activeProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#111111] p-6 shadow-2xl space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{activeProject.name}</h3>
                  <p className="text-xs font-mono text-[#20C997]">{activeProject.repoName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="rounded-xl border border-black/[0.06] dark:border-white/10 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {activeProject.description}
              </p>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Contributors</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeProject.contributorsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Commits</span>
                  <span className="font-bold text-slate-900 dark:text-white">{activeProject.commitsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Open Issues</span>
                  <span className="font-bold text-[#20C997]">{activeProject.openIssuesCount}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-black/[0.06] dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveProject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => { alert(`Redirecting to IDE workspace for ${activeProject.name}...`); setActiveProject(null); }}
                  className="px-4 py-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] text-xs font-bold text-slate-950 shadow-md transition-all"
                >
                  Open in Workspace IDE
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ExplorerLayout>
  );
}
