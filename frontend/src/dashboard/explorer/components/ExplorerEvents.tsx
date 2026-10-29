import { Link } from "react-router-dom";
import { domainGet } from "@/lib/domainApi";
import { normalizePublishedOpportunity, normalizePublishedHackathon } from "@/lib/api/opportunities";
import type { Opportunity } from "@/dashboard/_shared/opportunities/types";
import { ExplorerDataState } from "../useExplorerRecommendations";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { CalendarDays, Trophy, Users, MapPin, ExternalLink, Clock, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { ExplorerLayout } from "../layout/ExplorerLayout";

interface EcosystemEvent {
  id: string;
  title: string;
  organizer: string;
  type: string;
  dateRange: string;
  prizePool?: string;
  participantsCount: number | string;
  location: string;
  status: string;
  description: string;
}


export function ExplorerEvents() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [events, setEvents] = useState<EcosystemEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<EcosystemEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true; setLoading(true); setError(null);
    Promise.all([
      domainGet<{ opportunities?: unknown[] }>("/opportunities"),
      domainGet<{ hackathons?: unknown[] }>("/hackathons"),
    ]).then(([catalog, hackathons]) => {
      if (!alive) return;
      const entries = [
        ...(catalog.opportunities ?? []).filter(row => {
          const audience = (row as { audienceRoles?: string[] }).audienceRoles;
          return !audience?.length || audience.includes('explorer');
        }).map(normalizePublishedOpportunity),
        ...(hackathons.hackathons ?? []).map(normalizePublishedHackathon),
      ].filter((entry): entry is Opportunity => Boolean(entry));
      const unique = [...new Map(entries.map(entry => [entry.id, entry])).values()];
      setEvents(unique.filter(entry => entry.type === 'event' || entry.type === 'hackathon').map(entry => {
        const start = 'startDate' in entry && entry.startDate ? new Date(entry.startDate) : null;
        return {
          id: entry.id, title: entry.title, organizer: entry.organizer.name,
          type: entry.type === 'hackathon' ? 'Hackathon' : 'format' in entry && entry.format === 'demo-day' ? 'Demo Day' : 'format' in entry && entry.format === 'ama' ? 'AMA Session' : 'Webinar',
          dateRange: start && !Number.isNaN(start.getTime()) ? start.toLocaleDateString() : 'Date not published',
          prizePool: 'prizePool' in entry ? entry.prizePool : undefined,
          participantsCount: 'registrants' in entry ? entry.registrants : 'Not published',
          location: 'isVirtual' in entry ? entry.isVirtual ? 'Online' : 'See organizer details' : 'See organizer details',
          status: entry.type === 'hackathon' ? entry.hackathonStatus === 'live' ? 'Live Now' : entry.hackathonStatus === 'completed' ? 'Completed' : 'Upcoming' : start && start.getTime() < Date.now() ? 'Completed' : 'Upcoming',
          description: entry.summary,
        };
      }));
    }).catch((cause: unknown) => { if (alive) { setEvents([]); setError(cause instanceof Error ? cause.message : 'Events could not be loaded.'); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [revision]);

  const types = ["all", "Hackathon", "Demo Day", "Webinar", "AMA Session"];


  const filteredEvents = events.filter((e) => selectedType === "all" || e.type === selectedType);

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
            <span className="text-xs font-bold text-[#20C997] bg-[#20C997]/10 px-3 py-1.5 rounded-xl border border-[#20C997]/20">
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
                  ? "bg-[#20C997] text-slate-950 shadow-md shadow-[#20C997]/25"
                  : "bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              }`}
            >
              {t === "all" ? "All Events" : t}
            </button>
          ))}
        </div>

        <ExplorerDataState loading={loading} error={error} empty={filteredEvents.length === 0} retry={() => setRevision(value => value + 1)} />
        {/* Events Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((evt) => {
            const isRegistered = false;

            return (
              <div
                key={evt.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#20C997]/40 hover:shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        evt.status === "Live Now"
                          ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse"
                          : "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20"
                      }`}
                    >
                      {evt.status}
                    </span>

                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{evt.type}</span>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#20C997] transition-colors">
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
                    onClick={() => setActiveEvent(evt)}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      isRegistered
                        ? "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/30"
                        : "bg-[#20C997] hover:bg-[#1db587] text-slate-950 shadow-md transition-all"
                    }`}
                  >
                    {isRegistered ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Registered (RSVP Confirmed)</span>
                      </>
                    ) : (
                      <>
                        <span>View event details</span>
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
      <Dialog open={Boolean(activeEvent)} onOpenChange={open => { if (!open) setActiveEvent(null); }}>
        <DialogContent className="rounded-3xl bg-white text-slate-900 dark:bg-[#111111] dark:text-white">
          <DialogHeader><DialogTitle>{activeEvent?.title}</DialogTitle><DialogDescription>{activeEvent?.organizer} · {activeEvent?.dateRange}</DialogDescription></DialogHeader>
          <p className="text-sm">{activeEvent?.description}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">To participate, activate a Founder or Collaborator profile and complete the event's registration flow. Viewing this event does not register you.</p>
          <Link to="/explore/settings" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#20C997] px-4 font-semibold text-slate-950">Set up a participant profile</Link>
        </DialogContent>
      </Dialog>
    </ExplorerLayout>
  );
}
