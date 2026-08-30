import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listEvents } from "@/lib/demo/client";
import type { DemoEvent } from "@/lib/demo/types";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-surface-secondary text-text-secondary",
  scheduled: "bg-status-warning-soft text-status-warning",
  live: "bg-status-success-soft text-status-success",
  ended: "bg-surface-secondary text-text-muted",
  cancelled: "bg-status-error-soft text-status-error",
};

export function DemoList() {
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    listEvents().then((e) => { if (alive) { setEvents(e); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Demo Rooms</h1>
          <p className="text-sm text-text-muted mt-0.5">Schedule and run startup, investor, hackathon &amp; launch demos.</p>
        </div>
        <Link to="/demos/new" className="text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg">
          + New demo
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-text-disabled">Loading…</p>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-border-strong rounded-xl p-10 text-center text-text-muted">
          No demo rooms yet. <Link to="/demos/new" className="text-violet-600 hover:underline">Create your first one.</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e) => (
            <Link key={e.id} to={`/demos/${e.id}`} className="block border border-border-default bg-surface-primary rounded-xl p-4 hover:border-violet-300 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-text-primary truncate">{e.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLE[e.status] ?? "bg-surface-secondary text-text-secondary"}`}>{e.status}</span>
              </div>
              <p className="text-xs text-text-muted capitalize">{e.kind} demo</p>
              {e.description && <p className="text-xs text-text-muted mt-2 line-clamp-2">{e.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
