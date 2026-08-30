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
  "on-track": { label: "On track", pill: "bg-status-success-soft text-status-success border border-status-success" },
  "blocked":  { label: "Blocked",  pill: "bg-status-warning-soft text-status-warning border border-status-warning" },
  "pivoted":  { label: "Pivoted",  pill: "bg-violet-50 text-violet-700 border border-violet-200" },
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
        <div className="flex items-center gap-2 bg-status-warning-soft border border-status-warning rounded-lg px-4 py-3 mb-5">
          <Clock className="w-4 h-4 text-status-warning shrink-0" />
          <p className="text-sm text-status-warning">
            <span className="font-medium">Time for a check-in</span> — last update {relativeTime(lastCheckIn.loggedAt, now)}.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-text-primary mb-3">Build timeline</h2>
          {ordered.length === 0 ? (
            <div className="border border-dashed border-border-strong rounded-xl p-10 text-center">
              <p className="text-sm text-text-muted">No check-ins yet. Log your first one →</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {ordered.map((c) => {
                const meta = STATUS_META[c.status];
                return (
                  <li key={c.id} className="border border-border-default rounded-xl p-4 bg-surface-primary">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.pill}`}>{meta.label}</span>
                      <span className="text-xs text-text-disabled">{relativeTime(c.loggedAt, now)}</span>
                    </div>
                    <p className="text-sm text-text-primary">{c.update}</p>
                    {c.blocker && (
                      <div className="flex items-start gap-2 mt-2 bg-background-primary border border-border-default rounded-lg px-3 py-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-status-warning mt-0.5 shrink-0" />
                        <p className="text-xs text-text-muted">{c.blocker}</p>
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
          <div className="border border-border-default rounded-xl p-5 bg-surface-primary mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-violet-600" />
              <h3 className="text-base font-semibold text-text-primary">Team workspace</h3>
            </div>
            <p className="text-xs text-text-muted mb-4">
              Pipe your analyzed brief into a shared workspace your whole team can build in.
            </p>
            {registration.workspaceId ? (
              <Link to={`/team-workspace/${registration.teamId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-800">
                Open team workspace <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <button type="button" disabled={!registration.brief}
                  onClick={() => { void generate(registration); }}
                  className={`w-full text-sm font-medium px-4 py-2 rounded-lg ${registration.brief ? "bg-violet-600 text-white hover:bg-violet-700" : "bg-surface-secondary text-text-disabled cursor-not-allowed"}`}>
                  Create team workspace
                </button>
                {!registration.brief && <p className="text-xs text-text-disabled mt-2">Submit your brief first to unlock this.</p>}
              </>
            )}
          </div>

          {registration.promotedProjectId ? (
            <p className="flex items-center gap-1.5 text-xs text-status-success mt-3"><CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />Promoted to a startup</p>
          ) : (
            <button type="button" onClick={() => setPromoteOpen(true)}
              className="w-full text-sm font-medium px-4 py-2 rounded-lg border border-violet-300 text-violet-700 hover:bg-violet-50 mt-3">
              Promote to startup
            </button>
          )}

          <div className="border border-border-default rounded-xl p-5 bg-surface-primary lg:sticky lg:top-6">
            <h3 className="text-base font-semibold text-text-primary mb-4">Log check-in</h3>

            <fieldset className="mb-4">
              <legend className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Status</legend>
              <div className="space-y-1.5">
                {(["on-track", "blocked", "pivoted"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={status === s}
                      onChange={() => setStatus(s)}
                      className="accent-violet-600"
                    />
                    {STATUS_META[s].label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="mb-4">
              <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Update</label>
              <textarea
                rows={3}
                maxLength={MAX_UPDATE}
                value={update}
                onChange={(e) => setUpdate(e.target.value)}
                placeholder="What moved since the last check-in?"
                className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
              />
              <div className="flex justify-end mt-1">
                <span className="text-xs text-text-disabled">{update.length}/{MAX_UPDATE}</span>
              </div>
            </div>

            {status === "blocked" && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-text-secondary uppercase tracking-wider mb-1.5">Blocker</label>
                <textarea
                  rows={2}
                  value={blocker}
                  onChange={(e) => setBlocker(e.target.value)}
                  placeholder="What's in the way?"
                  className="w-full text-sm border border-border-strong rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                />
              </div>
            )}

            <button
              type="button"
              disabled={update.trim().length === 0 || submitting}
              onClick={() => void handleSubmit()}
              className={`w-full text-sm font-medium px-4 py-2 rounded-lg ${
                update.trim().length > 0
                  ? "bg-violet-600 text-white hover:bg-violet-700"
                  : "bg-surface-secondary text-text-disabled cursor-not-allowed"
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
