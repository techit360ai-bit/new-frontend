import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  History,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Unplug,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  connectTrustSource,
  disconnectTrustSource,
  fetchTrustBadges,
  fetchTrustHistory,
  fetchTrustIntegrations,
  fetchTrustProfile,
  previewTrustNotifications,
  refreshTrustSource,
  type TrustBadge,
  type TrustHistoryItem,
  type TrustIntegrationManifest,
  type TrustNotificationIntent,
  type TrustProfile,
} from "@/lib/api/trust";

type LoadState = "idle" | "loading" | "ready" | "error";

const sourceLabels: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  github: "GitHub",
  linkedin: "LinkedIn",
  domain: "Domain",
  website: "Website",
  organization: "Organization",
  deployment: "Deployment",
  product_analytics: "Product activity",
  team: "Team",
  milestone: "Milestone",
};

function statusClass(status?: string) {
  switch ((status ?? "").toLowerCase()) {
    case "verified":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "expired":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    case "failed":
      return "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400";
    case "disconnected":
      return "border-slate-300 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300";
    default:
      return "border-[#20C997]/20 bg-[#20C997]/10 text-[#20C997]";
  }
}

function formatDate(value?: string | null) {
  if (!value) return "Not synced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatFrequency(seconds: number) {
  if (!seconds) return "On demand";
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function historyToPreviewEvents(history: TrustHistoryItem[]) {
  return history.map((item) => ({
    notification_type:
      item.status === "expired"
        ? "trust_verification_expired"
        : item.status === "failed"
          ? "trust_verification_failed"
          : item.status === "disconnected"
            ? "trust_integration_disconnected"
            : "trust_badge_changed",
    source: item.source,
    status: item.status,
    severity: item.status === "expired" ? "critical" : item.status === "verified" ? "info" : "warning",
    message: `${sourceLabels[item.source] ?? item.source} verification ${item.status}.`,
    created_at: item.created_at,
    action_required: ["expired", "failed", "disconnected"].includes(String(item.status)),
  }));
}

export function TrustCenter() {
  const [state, setState] = useState<LoadState>("idle");
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [badges, setBadges] = useState<TrustBadge[]>([]);
  const [history, setHistory] = useState<TrustHistoryItem[]>([]);
  const [integrations, setIntegrations] = useState<TrustIntegrationManifest[]>([]);
  const [notifications, setNotifications] = useState<TrustNotificationIntent[]>([]);
  const [busySource, setBusySource] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [nextProfile, badgeResult, historyResult, integrationResult] = await Promise.all([
        fetchTrustProfile(),
        fetchTrustBadges(),
        fetchTrustHistory(30),
        fetchTrustIntegrations(),
      ]);
      const events = historyToPreviewEvents(historyResult.history);
      const preview = await previewTrustNotifications(events);
      setProfile(nextProfile);
      setBadges(badgeResult.badges);
      setHistory(historyResult.history);
      setIntegrations(integrationResult.integrations);
      setNotifications(preview.notification_intents);
      setState("ready");
    } catch (error) {
      setState("error");
      toast.error("Trust Center unavailable");
      if (typeof console !== "undefined") console.error(error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const latestBySource = useMemo(() => {
    const map = new Map<string, TrustHistoryItem>();
    for (const item of history) {
      const existing = map.get(item.source);
      const currentTime = new Date(item.created_at ?? 0).getTime();
      const existingTime = new Date(existing?.created_at ?? 0).getTime();
      if (!existing || currentTime >= existingTime) map.set(item.source, item);
    }
    return map;
  }, [history]);

  const actionRequired = notifications.filter((n) => n.action_required);
  const activeBadges = badges.filter((b) => b.active !== false);
  const expiringBadges = badges.filter((b) => b.expires_at && b.active !== false).slice(0, 4);

  const refreshSource = async (source: string) => {
    setBusySource(source);
    try {
      const result = await refreshTrustSource(source);
      toast.success(`${sourceLabels[source] ?? source} refresh queued`, {
        description: result.next_action,
      });
      await load();
    } finally {
      setBusySource(null);
    }
  };

  const disconnectSource = async (source: string) => {
    setBusySource(source);
    try {
      const result = await disconnectTrustSource(source);
      toast.success(`${sourceLabels[source] ?? source} disconnected`, {
        description: result.next_action,
      });
      await load();
    } finally {
      setBusySource(null);
    }
  };

  const score = Math.round(profile?.trust_score ?? 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#20C997]">
            <ShieldCheck className="w-4 h-4" />
            Trust Engine Lite
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Trust Center</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Metadata-only verification, expiring badges, immutable history, and founder-only alerts.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={state === "loading"} className="rounded-xl border-black/[0.08] dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/[0.06]">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${state === "loading" ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Trust score</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl sm:text-6xl font-black tabular-nums text-slate-900 dark:text-white">{score}</span>
                <span className="pb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">/100</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-[#20C997]/20 bg-[#20C997]/10 text-[#20C997] font-semibold" variant="outline">
                  {profile?.tier ?? "Unverified"}
                </Badge>
                <Badge className={`${statusClass(String(profile?.verification_status ?? "pending"))} font-semibold`} variant="outline">
                  {String(profile?.verification_status ?? "pending")}
                </Badge>
              </div>
            </div>
            <div className="grid min-w-[260px] gap-3 text-sm">
              <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Active badges</p>
                <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{activeBadges.length}</p>
              </div>
              <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-3.5">
                <p className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400">Last sync</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatDate(profile?.last_sync_at)}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-black/[0.06] dark:border-white/10 grid gap-3 grid-cols-2 md:grid-cols-4">
            {Object.entries(profile?.breakdown ?? {}).slice(0, 8).map(([key, value]) => (
              <div key={key} className="rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/10 p-3">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{key.replaceAll("_", " ")}</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-white">{Math.round(value)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Founder notifications</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{actionRequired.length} item(s) need attention</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Bell className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                No Trust alerts right now.
              </div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <div key={notification.notification_id} className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-3.5">
                  <div className="flex items-start gap-2.5">
                    {notification.severity === "critical" ? (
                      <AlertTriangle className="mt-0.5 w-4 h-4 text-rose-500 shrink-0" />
                    ) : notification.action_required ? (
                      <Clock className="mt-0.5 w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 w-4 h-4 text-emerald-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{notification.message}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {sourceLabels[notification.source ?? ""] ?? notification.source ?? "Trust"} · investor visible: no
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#20C997]/10 text-[#20C997]">
                <Award className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Verification badges</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Badges expire with their source verification.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {badges.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/[0.1] dark:border-white/10 p-5 text-sm text-slate-500 dark:text-slate-400 text-center col-span-full">
              No active Trust badges yet.
            </div>
          ) : (
            badges.map((badge) => (
              <div key={`${badge.badge_type}-${badge.source}`} className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{badge.label}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{sourceLabels[badge.source] ?? badge.source}</p>
                  </div>
                  <Badge className={`${statusClass(String(badge.status))} font-semibold`} variant="outline">
                    {badge.active === false ? "expired" : badge.status}
                  </Badge>
                </div>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Expires {formatDate(badge.expires_at)}</p>
              </div>
            ))
          )}
        </div>
        {expiringBadges.length > 0 && (
          <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 text-sm font-medium text-amber-800 dark:text-amber-300">
            Next expiry: {expiringBadges[0].label} on {formatDate(expiringBadges[0].expires_at)}.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#20C997]/10 text-[#20C997]">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connected verification sources</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Manual re-verification and disconnect controls.</p>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {integrations.map((manifest) => {
            const latest = latestBySource.get(manifest.source);
            const disabled = busySource === manifest.source;
            return (
              <div key={manifest.provider} className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900 dark:text-white">{manifest.display_name}</p>
                      <Badge className={`${statusClass(String(latest?.status ?? "pending"))} font-semibold`} variant="outline">
                        {latest?.status ?? "not verified"}
                      </Badge>
                      <Badge className="border-black/[0.06] dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400" variant="outline">
                        {formatFrequency(manifest.sync_frequency_seconds)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{manifest.access_description}</p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{manifest.storage_description}</p>
                    <p className="mt-3 text-xs text-slate-400">
                      Latest hash: {latest?.metadata_hash ? `${latest.metadata_hash.slice(0, 12)}...` : "none"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void refreshSource(manifest.source)}
                      disabled={disabled || !manifest.manual_reverification_supported}
                      className="rounded-xl border-black/[0.08] dark:border-white/10 dark:bg-[#111111] dark:text-white dark:hover:bg-white/[0.06]"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 mr-1 ${disabled ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void disconnectSource(manifest.source)}
                      disabled={disabled || !manifest.revocation_supported}
                      className="rounded-xl border-black/[0.08] dark:border-white/10 dark:bg-[#111111] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    >
                      <Unplug className="w-3.5 h-3.5 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {manifest.stored_fields.slice(0, 5).map((field) => (
                    <span key={field} className="rounded-lg bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#20C997]/10 text-[#20C997]">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Connect a Source</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Initiate verification for sources not yet connected.</p>
          </div>
        </div>
        {(() => {
          const allSources = [
            "email",
            "phone",
            "github",
            "linkedin",
            "domain",
            "website",
            "organization",
            "deployment",
            "product_analytics",
            "team",
            "milestone",
          ];
          const connectedSources = new Set(integrations.map((i) => i.source));
          const unconnectedSources = allSources.filter((s) => !connectedSources.has(s));

          if (unconnectedSources.length === 0) {
            return (
              <div className="rounded-xl border border-dashed border-[#20C997]/20 bg-[#20C997]/10 p-5 text-sm font-medium text-[#20C997]">
                All sources are connected.
              </div>
            );
          }

          return (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {unconnectedSources.map((source) => {
                const disabled = busySource === source;
                return (
                  <div
                    key={source}
                    className="flex items-center justify-between rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4"
                  >
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {sourceLabels[source] ?? source}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="rounded-xl border-[#20C997]/20 text-[#20C997] bg-[#20C997]/10 hover:bg-[#20C997]/20 font-bold"
                      disabled={disabled}
                      onClick={async () => {
                        setBusySource(source);
                        try {
                          const result = await connectTrustSource(source);
                          toast.success(
                            `${sourceLabels[source] ?? source} verification initiated`,
                            { description: result.next_action }
                          );
                          await load();
                        } catch {
                          toast.error(
                            `Failed to connect ${sourceLabels[source] ?? source}`
                          );
                        } finally {
                          setBusySource(null);
                        }
                      }}
                    >
                      {disabled ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 mr-1" />
                      )}
                      Connect
                    </Button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">Immutable Trust timeline</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Append-only verification history with metadata hashes.</p>
          </div>
        </div>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-black/[0.1] dark:border-white/10 p-5 text-sm text-slate-500 dark:text-slate-400 text-center">
              No Trust timeline entries yet.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.verification_id} className="grid gap-3 rounded-xl border border-black/[0.06] dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{item.event_type || `${item.source}_${item.status}`}</p>
                    <Badge className={`${statusClass(String(item.status))} font-semibold`} variant="outline">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {sourceLabels[item.source] ?? item.source} · created {formatDate(item.created_at)} · expires {formatDate(item.expires_at)}
                  </p>
                  <p className="mt-2 text-xs text-slate-400 font-mono">
                    Hash: {item.metadata_hash ? `${item.metadata_hash.slice(0, 18)}...` : "none"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5" />
                  append-only
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
