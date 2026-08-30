import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
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
  { value: "all", label: "All" },
  { value: "project", label: "Project" },
  { value: "advisory", label: "Advisory" },
  { value: "gig", label: "Gig" },
  { value: "testing", label: "Testing" },
  { value: "collaboration", label: "Collaboration calls" },
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
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Opportunities</h1>
          <p className="text-sm text-text-muted mt-0.5">Matched against your stack, equity preference, and availability.</p>
        </div>
        <button onClick={handleRefresh} disabled={loading || refreshing}
          className="h-9 px-3 text-sm text-text-secondary hover:bg-surface-secondary rounded-lg flex items-center gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh matches
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full border text-sm ${
              filter === f.value
                ? "border-status-warning bg-status-warning-soft text-status-warning"
                : "border-border-strong bg-surface-primary text-text-secondary hover:border-status-warning"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {loading && <p className="text-sm text-text-muted col-span-3">Loading live opportunities...</p>}
        {!loading && error && (
          <div className="col-span-3 border border-status-error bg-status-error-soft rounded-xl p-5">
            <p className="text-sm font-semibold text-status-error">Live opportunities are unavailable.</p>
            <p className="text-sm text-status-error mt-1">{error}</p>
            <button onClick={() => void loadOpportunities(true)}
              className="mt-3 text-xs px-3 py-1.5 border border-status-error rounded-lg text-status-error hover:bg-status-error-soft">
              Try again
            </button>
          </div>
        )}
        {!loading && !error && visible.length === 0 && (
          <p className="text-sm text-text-muted col-span-3">No live opportunities in this category yet.</p>
        )}
        {!loading && !error && visible.map((o) => {
          const applied = o.status === "applied";
          return (
            <div key={o.id} className={`border rounded-xl p-5 ${applied ? "bg-status-success-soft/40 border-status-success" : "bg-surface-primary border-border-default"}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold">{o.type}</p>
                  <h3 className="font-semibold text-text-primary mt-1">{o.title}</h3>
                  <p className="text-sm text-text-muted">{o.company}</p>
                </div>
                {o.matchScore > 0 && <span className="text-sm font-semibold text-status-warning tabular-nums">{o.matchScore}% profile fit</span>}
              </div>
              <p className="text-sm text-text-secondary mb-3">{compLabel(o)}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {o.skills.map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted">{s}</span>
                ))}
              </div>
              <p className="text-xs text-text-muted mb-4">{o.timeCommitment} · Team {o.teamQuality} · Risk {o.riskLevel}</p>

              {applied ? (
                <div className="text-xs text-status-success font-semibold py-2">Application sent</div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setDetail(o)} className="flex-1 text-xs px-3 py-1.5 border border-border-strong rounded-lg hover:bg-background-primary">View details</button>
                  <button onClick={() => void handleInterest(o.id)} className="flex-1 text-xs px-3 py-1.5 bg-status-warning text-text-primary font-semibold rounded-lg hover:bg-amber-400">Express interest</button>
                  <button onClick={() => void handlePass(o.id)} className="text-xs px-3 py-1.5 text-text-muted hover:bg-surface-secondary rounded-lg">Pass</button>
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
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">About</p>
                  <p className="text-sm text-text-secondary">{detail.description}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Compensation</p>
                  <p className="text-sm text-text-secondary">{compLabel(detail)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Timeline</p>
                  <p className="text-sm text-text-secondary">{detail.timeline}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-1">Team</p>
                  <ul className="space-y-1">
                    {detail.teamBios.map((b) => (
                      <li key={b.name} className="text-sm text-text-secondary">{b.name} <span className="text-text-muted">· {b.role}</span></li>
                    ))}
                  </ul>
                </div>
                <button onClick={() => { void handleInterest(detail.id); setDetail(null); }}
                  className="w-full h-10 bg-status-warning hover:bg-amber-400 text-text-primary font-semibold rounded-lg">
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
