import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import {
  fetchCollaboratorOpportunities,
  patchCollaboratorOpportunityStatus,
  type CollaboratorOpportunity,
} from "@/lib/api/opportunities";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

type Filter = "all" | CollaboratorOpportunity["type"];
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "project", label: "Project" },
  { value: "advisory", label: "Advisory" },
  { value: "gig", label: "Gig" },
  { value: "testing", label: "Testing" },
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
      const updated = await patchCollaboratorOpportunityStatus(id, "applied");
      setOpps((cur) => cur.map((row) => row.id === id ? updated : row));
      toast.success(`Application sent to ${o.company}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update opportunity status.");
    }
  };

  const handlePass = async (id: string) => {
    const removed = opps.find((o) => o.id === id);
    if (!removed) return;
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
    if (o.cashCompMonthly > 0)  parts.push(`$${(o.cashCompMonthly / 1000).toFixed(0)}K/mo`);
    if (o.cashCompOneTime > 0)  parts.push(`$${o.cashCompOneTime.toLocaleString()} one-time`);
    if (o.equityPercent > 0)    parts.push(`${o.equityPercent}% equity`);
    return parts.join(" + ") || "Compensation TBD";
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-500 mt-0.5">Matched against your stack, equity preference, and availability.</p>
        </div>
        <button onClick={handleRefresh} disabled={loading || refreshing}
          className="h-9 px-3 text-sm text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh matches
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              filter === f.value
                ? "border-amber-500 bg-amber-50 text-amber-700"
                : "border-slate-300 bg-white text-slate-700 hover:border-amber-300"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-slate-500 col-span-3">Loading live opportunities...</p>}
        {!loading && error && (
          <div className="col-span-3 border border-red-200 bg-red-50 rounded-xl p-5">
            <p className="text-sm font-semibold text-red-700">Live opportunities are unavailable.</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button onClick={() => void loadOpportunities(true)}
              className="mt-3 text-xs px-3 py-1.5 border border-red-300 rounded-lg text-red-700 hover:bg-red-100">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-slate-500 col-span-3">No live opportunities in this category yet.</p>
        )}
        {!loading && !error && visible.map((o) => {
          const applied = o.status === "applied";
          return (
            <div key={o.id} className={`border rounded-xl p-5 ${applied ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-slate-200"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{o.type}</p>
                  <h3 className="font-semibold text-slate-900 mt-1">{o.title}</h3>
                  <p className="text-sm text-slate-600">{o.company}</p>
                </div>
                <span className="text-sm font-semibold text-amber-700 tabular-nums">{o.matchScore}%</span>
              </div>
              <p className="text-sm text-slate-700 mb-3">{compLabel(o)}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {o.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{s}</span>
                ))}
              </div>
              <p className="text-xs text-slate-500 mb-4">{o.timeCommitment} · Team {o.teamQuality} · Risk {o.riskLevel}</p>

              {applied ? (
                <div className="text-xs text-emerald-700 font-semibold py-2">Application sent</div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setDetail(o)} className="flex-1 text-xs px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50">View details</button>
                  <button onClick={() => void handleInterest(o.id)} className="flex-1 text-xs px-3 py-1.5 bg-amber-500 text-slate-900 font-semibold rounded-lg hover:bg-amber-400">Express interest</button>
                  <button onClick={() => void handlePass(o.id)} className="text-xs px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">Pass</button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Sheet open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
        <SheetContent className="sm:max-w-lg">
          {detail && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.title}</SheetTitle>
                <SheetDescription>{detail.company} · {detail.type}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">About</p>
                  <p className="text-sm text-slate-700">{detail.description}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Compensation</p>
                  <p className="text-sm text-slate-700">{compLabel(detail)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Timeline</p>
                  <p className="text-sm text-slate-700">{detail.timeline}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Team</p>
                  <ul className="space-y-1">
                    {detail.teamBios.map((b) => (
                      <li key={b.name} className="text-sm text-slate-700">{b.name} <span className="text-slate-500">· {b.role}</span></li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => { void handleInterest(detail.id); setDetail(null); }}
                  className="w-full h-10 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg">
                  Express interest
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
