import { useState } from "react";
import { CalendarDays, Trophy, Users, MapPin, ExternalLink, Clock, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface EcosystemEvent {
  id: string;
  title: string;
  organizer: string;
  type: "Hackathon" | "Demo Day" | "Webinar" | "AMA Session";
  dateRange: string;
  prizePool?: string;
  participantsCount: number;
  location: string;
  status: "Live Now" | "Upcoming" | "Completed";
  description: string;
}

const MOCK_EVENTS: EcosystemEvent[] = [
  {
    id: "evt-1",
    title: "AI Agentic Hackathon 2026",
    organizer: "TechIT Global Incubator",
    type: "Hackathon",
    dateRange: "Sep 15 - Sep 18, 2026",
    prizePool: "$25,000 + TechIT Credits",
    participantsCount: 420,
    location: "Global Virtual",
    status: "Upcoming",
    description: "48-hour build marathon focused on autonomous AI agents, tool invocation pipelines, and LLM dev tools."
  },
  {
    id: "evt-2",
    title: "TechIT Q3 Global Demo Day",
    organizer: "TechIT Investor Network",
    type: "Demo Day",
    dateRange: "Sep 22, 2026",
    prizePool: "$100,000 Investment Pool",
    participantsCount: 180,
    location: "San Francisco & Stream",
    status: "Upcoming",
    description: "Top 15 graduated startups from the incubation cohort pitch live to accredited angel investors & VCs."
  },
  {
    id: "evt-3",
    title: "Building Micro-Equity Cap Tables on Web3",
    organizer: "Nexus Protocol Team",
    type: "Webinar",
    dateRange: "Sep 12, 2026 (Today)",
    participantsCount: 95,
    location: "Live Stream",
    status: "Live Now",
    description: "Deep dive workshop into vesting schedules, smart contract security, and fair founder-collaborator splits."
  }
];

export function ExplorerEvents() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [registeredEvents, setRegisteredEvents] = useState<Record<string, boolean>>({});

  const types = ["all", "Hackathon", "Demo Day", "Webinar", "AMA Session"];

  const toggleRegister = (id: string) => {
    setRegisteredEvents((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEvents = MOCK_EVENTS.filter((e) => selectedType === "all" || e.type === selectedType);

  return (
    <ExplorerLayout>
      <div className="space-y-6 max-w-7xl mx-auto font-bricolage">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Events & Hackathons</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Participate in ecosystem hackathons, demo days, webinars, and workshops.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] bg-blue-50 dark:bg-blue-950/30 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-800">
              {filteredEvents.length} Events Listed
            </span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === t
                  ? "bg-[#0066ff] text-white shadow-md shadow-[#0066ff]/25"
                  : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {t === "all" ? "All Events" : t}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt) => {
            const isRegistered = Boolean(registeredEvents[evt.id]);

            return (
              <div
                key={evt.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#0066ff]/40 dark:hover:border-[#58a6ff]/40 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        evt.status === "Live Now"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse"
                          : "bg-blue-50 dark:bg-blue-950/40 text-[#0066ff] dark:text-[#58a6ff] border border-blue-200 dark:border-blue-800"
                      }`}
                    >
                      {evt.status}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{evt.type}</span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors">
                    {evt.title}
                  </h3>

                  <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{evt.organizer}</p>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{evt.description}</p>

                  {evt.prizePool && (
                    <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
                      <Trophy className="h-4 w-4 shrink-0" />
                      <span>{evt.prizePool}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                      {evt.dateRange}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      {evt.participantsCount} Joined
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleRegister(evt.id)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isRegistered
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] text-white shadow-md hover:opacity-95"
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Registered (RSVP Confirmed)</span>
                      </>
                    ) : (
                      <>
                        <span>RSVP / Register Now</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ExplorerLayout>
  );
}
