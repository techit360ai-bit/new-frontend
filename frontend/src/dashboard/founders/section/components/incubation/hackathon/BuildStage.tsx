import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle, Clock, AlertTriangle, Rocket, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { HackathonRegistration, CheckIn } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { computeMomentum } from "@/dashboard/_shared/hackathon/momentum";
import { logHackathonCheckIn } from "@/lib/api/hackathon";
import { useGenerateTeamWorkspace } from "./useGenerateTeamWorkspace";
import { PromoteToStartupModal } from "./PromoteToStartupModal";

interface Props {
  registration: HackathonRegistration;
}

const STATUS_META: Record<CheckIn["status"], { label: string; pill: string }> = {
  "on-track": { label: "On track", pill: "bg-[#20c937]/10 text-[#20c937] border border-[#20c937]/25" },
  "blocked":  { label: "Blocked",  pill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25" },
  "pivoted":  { label: "Pivoted",  pill: "bg-[#0066ff]/10 text-[#0066ff] dark:text-[#58a6ff] border border-[#0066ff]/25" },
};

function relativeTime(iso: string, now: number): string {
  const diff = now - new Date(iso).getTime();
  const mins = Math.floor(diff / (1000 * 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return remMins > 0 ? `${hours}h ${remMins}m ago` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const MAX_UPDATE = 140;
const EMPTY_CHECK_INS: CheckIn[] = [];

export function BuildStage({ registration }: Props) {
  const { registerForHackathon } = useFounderProfile();
  const now = useMemo(() => Date.now(), []);

  const [status, setStatus] = useState<CheckIn["status"]>("on-track");
  const [update, setUpdate] = useState("");
  const [blocker, setBlocker] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const generate = useGenerateTeamWorkspace();
  const [promoteOpen, setPromoteOpen] = useState(false);

  const checkIns = useMemo(() => registration.checkIns ?? EMPTY_CHECK_INS, [registration.checkIns]);
  const ordered = useMemo(
    () => [...checkIns].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()),
    [checkIns],
  );

  const momentum = computeMomentum(registration, now);
  const lastCheckIn = ordered[0];
  const showReminder = momentum.nextAction === "log-check-in" && !!registration.brief && checkIns.length > 0;

  const handleSubmit = async () => {
    if (update.trim().length === 0) return;
    setSubmitting(true);
    try {
      const result = await logHackathonCheckIn(registration.hackathonId, {
        teamId: registration.teamId,
        note: update.trim(),
        status,
        blocker: status === "blocked" ? blocker.trim() : "",
        progressDelta: status === "on-track" ? 15 : status === "blocked" ? 3 : 8,
      });
      if (!result.ok || !result.registration) {
        toast.error("The check-in was not persisted.");
        return;
      }
      registerForHackathon(result.registration);
      toast.success("Check-in logged");
      setStatus("on-track");
      setUpdate("");
      setBlocker("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "The check-in could not be logged.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {showReminder && lastCheckIn && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-5">
          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-bold">Time for a check-in</span> — last update {relativeTime(lastCheckIn.loggedAt, now)}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-bold text-[#171330] dark:text-white mb-3">Build timeline</h2>
          {ordered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/[0.08] dark:border-white/10 bg-white/40 dark:bg-[#121212]/40 backdrop-blur-xl p-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No check-ins yet. Log your first one →</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {ordered.map((c) => {
                const meta = STATUS_META[c.status];
                return (
                  <li key={c.id} className="rounded-2xl border border-black/[0.06] dark:border-white/10 p-4 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
                      <span className="text-xs text-slate-400">{relativeTime(c.loggedAt, now)}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200">{c.update}</p>
                    {c.blocker && (
                      <div className="flex items-start gap-2 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 dark:text-amber-300">{c.blocker}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Log form */}
        <div className="lg:col-span-1">
          {/* Team workspace — pipe the analyzed brief into a shared build space */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 p-5 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-[#0066ff] dark:text-[#58a6ff]" />
              <h3 className="text-base font-bold text-[#171330] dark:text-white">Team workspace</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pipe your analyzed brief into a shared workspace your whole team can build in.
            </p>
            {registration.workspaceId ? (
              <Link to={`/team-workspace/${registration.teamId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
                Open team workspace <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button type="button" disabled={!registration.brief}
                  onClick={() => { void generate(registration); }}
                  className={`w-full text-sm font-bold px-4 py-2.5 rounded-xl transition-all ${registration.brief ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]" : "bg-black/[0.04] dark:bg-white/[0.04] text-slate-400 cursor-not-allowed"}`}>
                  Create team workspace
                </button>
                {!registration.brief && <p className="text-xs text-slate-400 mt-2">Submit your brief first to unlock this.</p>}
              </>
            )}
          </div>

          {registration.promotedProjectId ? (
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#20c937] mt-3"><CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />Promoted to a startup</p>
          ) : (
            <button type="button" onClick={() => setPromoteOpen(true)}
              className="w-full text-sm font-bold px-4 py-2.5 rounded-xl border border-[#0066ff]/30 text-[#0066ff] dark:text-[#58a6ff] hover:bg-[#0066ff]/10 transition-colors mb-6">
              Promote to startup
            </button>
          )}

          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 p-5 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] lg:sticky lg:top-6">
            <h3 className="text-base font-bold text-[#171330] dark:text-white mb-4">Log check-in</h3>

            <fieldset className="mb-4">
              <legend className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Status</legend>
              <div className="space-y-1.5">
                {(["on-track", "blocked", "pivoted"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="accent-[#0066ff]"
                    />
                    {STATUS_META[s].label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Update</label>
              <textarea
                rows={3}
                maxLength={MAX_UPDATE}
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                placeholder="What moved since the last check-in?"
                className="w-full text-sm border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-xl px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-colors"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-slate-400">{update.length}/{MAX_UPDATE}</span>
              </div>
            </div>

            {status === "blocked" && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Blocker</label>
                <textarea
                  rows={2}
                  value={blocker}
                  onChange={(e) => setBlocker(e.target.value)}
                  placeholder="What's in the way?"
                  className="w-full text-sm border border-black/[0.08] dark:border-white/10 bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white rounded-xl px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 focus:border-[#0066ff] transition-colors"
                />
              </div>
            )}

            <button
              type="button"
              disabled={update.trim().length === 0 || submitting}
              onClick={() => void handleSubmit()}
              className={`w-full text-sm font-bold px-4 py-2.5 rounded-xl transition-all ${
                update.trim().length > 0
                  ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)]"
                  : "bg-black/[0.04] dark:bg-white/[0.04] text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitting ? "Logging..." : "Log check-in"}
            </button>
          </div>
        </div>
      </div>

      {promoteOpen && <PromoteToStartupModal registration={registration} onClose={() => setPromoteOpen(false)} />}
    </div>
  );
}
