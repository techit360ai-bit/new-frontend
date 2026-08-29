import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listEvents } from "@/lib/demo/client";
import type { DemoEvent } from "@/lib/demo/types";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-amber-50 text-amber-700",
  live: "bg-emerald-50 text-emerald-700",
  ended: "bg-slate-100 text-slate-500",
  cancelled: "bg-red-50 text-red-700",
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
          <h1 className="text-2xl font-bold text-slate-900">Demo Rooms</h1>
          <p className="text-sm text-slate-500 mt-0.5">Schedule and run startup, investor, hackathon &amp; launch demos.</p>
        </div>
        <Link to="/demos/new" className="text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg">
          + New demo
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500">
          No demo rooms yet. <Link to="/demos/new" className="text-violet-600 hover:underline">Create your first one.</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e) => (
            <Link key={e.id} to={`/demos/${e.id}`} className="block border border-slate-200 bg-white rounded-xl p-4 hover:border-violet-300 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900 truncate">{e.title}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide ${STATUS_STYLE[e.status] ?? "bg-slate-100 text-slate-700"}`}>{e.status}</span>
              </div>
              <p className="text-xs text-slate-500 capitalize">{e.kind} demo</p>
              {e.description && <p className="text-xs text-slate-600 mt-2 line-clamp-2">{e.description}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
