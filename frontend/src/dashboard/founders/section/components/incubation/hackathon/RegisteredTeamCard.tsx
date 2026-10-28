import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Copy, Check, X, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { computeMomentum, momentumColor } from "@/dashboard/_shared/hackathon/momentum";
import { patchHackathonTeam } from "@/lib/api/hackathon";

const NEXT_ACTION_CTA: Record<
  ReturnType<typeof computeMomentum>["nextAction"],
  { label: string; stage: "brief" | "build" | "submit" }
> = {
  "submit-brief": { label: "Submit brief →", stage: "brief" },
  "log-check-in": { label: "Log check-in →", stage: "build" },
  "build":        { label: "Open team", stage: "build" },
  "complete":     { label: "View results →", stage: "submit" },
};

interface Props {
  registration: HackathonRegistration;
  hackathon: Hackathon;
}

function daysUntil(iso: string): number {
  const ms = new Date(iso).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function inviteUrl(reg: HackathonRegistration): string {
  return `https://techit.ai/h/${reg.hackathonId}/team/${reg.teamId}?token=${reg.inviteToken}`;
}

export function RegisteredTeamCard({ registration, hackathon }: Props) {
  const navigate = useNavigate();
  const { registerForHackathon } = useFounderProfile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [updatingRoster, setUpdatingRoster] = useState(false);

  const days = daysUntil(hackathon.startDate);
  const memberCount = registration.members.length + 1; // +1 for the leader
  const teamSize = memberCount + registration.openRoles.length;

  const momentum = useMemo(() => computeMomentum(registration, Date.now()), [registration]);
  const momColor = momentumColor(momentum.score);
  const cta = NEXT_ACTION_CTA[momentum.nextAction];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteUrl(registration));
    setCopied(true);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleRoster = async () => {
    setUpdatingRoster(true);
    try {
      const persisted = await patchHackathonTeam(
        registration.hackathonId,
        registration.teamId,
        { rosterClosed: !registration.rosterClosed },
      );
      if (!persisted) {
        toast.error("The roster state was not persisted.");
        return;
      }
      registerForHackathon(persisted);
      toast.success(registration.rosterClosed ? "Roster reopened" : "Roster closed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The roster could not be updated.");
    } finally {
      setUpdatingRoster(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 p-5 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden="true">{hackathon.poster}</span>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">{hackathon.title}</p>
              <h3 className="text-base font-bold text-[#171330] dark:text-white truncate">{registration.teamName}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 mt-1.5 font-medium">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{memberCount} of {teamSize}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Starts in {days} days</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{momentum.nextActionLabel}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-2xl font-black leading-none ${momColor.text}`}>{momentum.score}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5 font-semibold">Momentum</p>
            <div className="h-1.5 w-16 rounded-full bg-black/[0.06] dark:bg-white/10 mt-1">
              <div className={`h-1.5 rounded-full ${momColor.bar}`} style={{ width: `${momentum.score}%` }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            Manage team →
          </button>
          <button
            type="button"
            onClick={() => navigate(`/matches?hackathon=${registration.hackathonId}`)}
            className="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
          >
            Find collaborators →
          </button>
          <button
            type="button"
            onClick={() => navigate(`/incubation-hub?panel=hackathon&stage=${cta.stage}`)}
            className="text-xs font-bold px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all"
          >
            {cta.label}
          </button>
        </div>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="w-full max-w-md bg-white dark:bg-[#121212] border-l border-black/[0.08] dark:border-white/10 shadow-2xl overflow-y-auto" role="dialog" aria-label="Manage team">
            <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-white/10">
              <h2 className="text-base font-bold text-[#171330] dark:text-white">Manage team</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">{hackathon.title}</p>
                <h3 className="text-lg font-bold text-[#171330] dark:text-white">{registration.teamName}</h3>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Members ({memberCount} of {teamSize})</p>
                <ul className="space-y-2">
                  <li className="flex items-center justify-between text-sm border border-black/[0.06] dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50/50 dark:bg-white/[0.02]">
                    <span className="text-slate-900 dark:text-white font-medium">You · Leader</span>
                  </li>
                  {registration.members.map((m) => (
                    <li key={m.collaboratorId} className="flex items-center justify-between text-sm border border-black/[0.06] dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50/50 dark:bg-white/[0.02]">
                      <span className="text-slate-900 dark:text-white font-medium">{m.name} · {m.role}</span>
                    </li>
                  ))}
                  {registration.openRoles.map((r) => (
                    <li key={r} className="flex items-center justify-between text-sm border border-dashed border-black/[0.12] dark:border-white/15 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400">
                      <span>Open: {r}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Invite link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteUrl(registration)}
                    className="flex-1 text-xs border border-black/[0.08] dark:border-white/10 rounded-xl px-3 py-2 bg-slate-50 dark:bg-[#1a1a1a] text-slate-700 dark:text-slate-300 font-mono truncate outline-none"
                    aria-label="Invite link"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-xs font-bold px-3 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-[#20c937]" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => void handleToggleRoster()}
                  disabled={updatingRoster}
                  className="text-xs font-bold px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                >
                  {updatingRoster
                    ? "Saving..."
                    : registration.rosterClosed
                      ? "Reopen roster"
                      : "Close roster"}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  {registration.rosterClosed
                    ? "Roster is closed. Invite link shows 'team is full' to visitors."
                    : "Closing the roster prevents new members from joining via the invite link."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
