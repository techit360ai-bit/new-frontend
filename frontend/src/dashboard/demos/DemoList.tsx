import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Video, Radio, ArrowUpRight, Sparkles } from "lucide-react";
import { listEvents } from "@/lib/demo/client";
import type { DemoEvent } from "@/lib/demo/types";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
  scheduled: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  live: "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 font-bold",
  ended: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
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
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 font-bricolage animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Video className="w-7 h-7 text-[#20C997]" />
            <span>Demo Rooms</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Schedule and run live startup, investor, hackathon &amp; launch demos.
          </p>
        </div>
        <Link
          to="/demos/new"
          className="h-10 px-4 bg-[#20C997] hover:bg-[#1db587] text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Demo Room</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 py-8 justify-center">
          <div className="w-4 h-4 border-2 border-[#20C997] border-t-transparent rounded-full animate-spin" />
          <span>Loading demo rooms...</span>
        </div>
      ) : events.length === 0 ? (
        <div className="border border-dashed border-slate-300 dark:border-white/10 rounded-2xl p-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-[#111111]/40">
          <Video className="w-8 h-8 mx-auto mb-2 text-slate-400/60" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">No demo rooms active yet</p>
          <p>
            <Link to="/demos/new" className="text-[#20C997] hover:underline font-bold">
              Create your first demo room →
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((e) => (
            <Link
              key={e.id}
              to={`/demos/${e.id}`}
              className="block border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-5 shadow-sm hover:border-[#20C997]/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-[#20C997] transition-colors flex items-center gap-1.5">
                  {e.title}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#20C997]" />
                </span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold shrink-0 ${STATUS_STYLE[e.status] ?? "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20"}`}>
                  {e.status === "live" && <Radio className="w-2.5 h-2.5 inline mr-1 animate-pulse" />}
                  {e.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">{e.kind} demo</p>
              {e.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                  {e.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
