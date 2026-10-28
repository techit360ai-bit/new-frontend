import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Opportunity, OpportunityType, OpportunityStatus } from "@/dashboard/_shared/opportunities/types";
import { fetchFounderOpportunityCatalog } from "@/lib/api/opportunities";
import { OpportunityCard } from "./OpportunityCard";

type TypeFilter = "all" | OpportunityType;
type StatusFilter = "all" | OpportunityStatus;

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: "All",
  hackathon: "Hackathons",
  program: "Programs",
  funding: "Funding",
  event: "Events",
  collaboration: "Collaboration calls",
};

const STATUS_RANK: Record<OpportunityStatus, number> = { open: 0, "closing-soon": 1, closed: 2 };

export default function OpportunityHub() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    fetchFounderOpportunityCatalog()
      .then((rows) => {
        if (alive) setOpportunities(rows);
      })
      .catch((err) => {
        if (!alive) return;
        setOpportunities([]);
        setError(err instanceof Error ? err.message : "Live opportunities are unavailable.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return opportunities
      .filter((o) => typeFilter === "all" || o.type === typeFilter)
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!q) return true;
        return (
          o.title.toLowerCase().includes(q) ||
          o.organizer.name.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const r = STATUS_RANK[a.status] - STATUS_RANK[b.status];
        if (r !== 0) return r;
        return new Date(a.applyDeadline).getTime() - new Date(b.applyDeadline).getTime();
      });
  }, [opportunities, typeFilter, statusFilter, search]);

  const featured: Opportunity | null = useMemo(() => {
    return filtered.find((o) => o.featured && o.status === "open") ?? filtered.find((o) => o.status === "open") ?? filtered[0] ?? null;
  }, [filtered]);

  const gridItems = useMemo(() => filtered.filter((o) => o.id !== featured?.id), [filtered, featured]);

  const counts = useMemo(() => {
    const c: Record<TypeFilter, number> = { all: 0, hackathon: 0, program: 0, funding: 0, event: 0, collaboration: 0 };
    for (const o of opportunities) {
      if (statusFilter !== "all" && o.status !== statusFilter) continue;
      c.all++;
      c[o.type]++;
    }
    return c;
  }, [opportunities, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Opportunity Hub</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5">Programs, hackathons, funding, events and ownership-focused collaboration calls.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTypeFilter(t)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all ${
                typeFilter === t
                  ? "bg-[#0066ff] text-white border-[#0066ff] shadow-[0_4px_12px_rgba(0,102,255,0.25)]"
                  : "bg-white/80 dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 border-black/[0.08] dark:border-white/10 hover:border-[#0066ff]/40 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
              }`}
            >
              {TYPE_LABELS[t]} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto mt-2 sm:mt-0">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#0066ff] transition-all"
            aria-label="Status filter"
          >
            <option value="all">All status</option>
            <option value="open">Open</option>
            <option value="closing-soon">Closing soon</option>
            <option value="closed">Closed</option>
          </select>
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search opportunities"
              className="w-full text-xs pl-9 pr-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
              aria-label="Search opportunities"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl rounded-2xl p-12 text-center shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live opportunities...</p>
        </div>
      ) : error ? (
        <div className="border border-rose-500/20 bg-rose-500/10 rounded-2xl p-8 text-center">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">Live opportunities are unavailable: {error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-black/[0.1] dark:border-white/10 rounded-2xl p-12 text-center bg-white/40 dark:bg-white/[0.02]">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {opportunities.length === 0
              ? "Organizations haven't published any opportunities yet."
              : `No ${typeFilter === "all" ? "" : TYPE_LABELS[typeFilter].toLowerCase() + " "}opportunities match. Try a different filter.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {featured && (
            <div className="lg:col-span-3">
              <OpportunityCard opportunity={featured} variant="featured" />
            </div>
          )}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            {gridItems.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} variant="grid" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
