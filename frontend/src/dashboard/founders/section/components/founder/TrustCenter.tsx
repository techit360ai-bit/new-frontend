import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Award,
  Bell,
  CheckCircle2,
  Clock,
  History,
  Info,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Unplug,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  connectTrustSource,
  createTrustDomainChallenge,
  verifyTrustDomainChallenge,
  disconnectTrustSource,
  decideFounderTrustAccessRequest,
  fetchTrustBadges,
  fetchFounderTrustAccessRequests,
  fetchTrustHistory,
  fetchTrustIntegrations,
  fetchTrustProfile,
  previewTrustNotifications,
  refreshTrustSource,
  type TrustBadge,
  type FounderTrustAccessRequest,
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
      return "border-status-success bg-status-success-soft text-status-success";
    case "expired":
      return "border-status-warning bg-status-warning-soft text-status-warning";
    case "failed":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "disconnected":
      return "border-border-default bg-surface-secondary text-text-secondary";
    default:
      return "border-cyan-200 bg-cyan-50 text-cyan-700";
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
  const [accessRequests, setAccessRequests] = useState<FounderTrustAccessRequest[]>([]);
  const [introDismissed, setIntroDismissed] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [nextProfile, badgeResult, historyResult, integrationResult, accessResult] = await Promise.all([
        fetchTrustProfile(),
        fetchTrustBadges(),
        fetchTrustHistory(30),
        fetchTrustIntegrations(),
        fetchFounderTrustAccessRequests(),
      ]);
      const events = historyToPreviewEvents(historyResult.history);
      const preview = await previewTrustNotifications(events);
      setProfile(nextProfile);
      setBadges(badgeResult.badges);
      setHistory(historyResult.history);
      setIntegrations(integrationResult.integrations);
      setNotifications(preview.notification_intents);
      setAccessRequests(accessResult.requests);
      setState("ready");
    } catch (error) {
      setState("error");
      toast.error("Trust Center unavailable");
      if (typeof console !== "undefined") console.error(error);
    }
  }, []);

  useEffect(() => {
    try { setIntroDismissed(sessionStorage.getItem("techit:trust-center-intro:dismissed") === "1"); } catch { setIntroDismissed(false); }
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
  const dismissIntro = () => { setIntroDismissed(true); try { sessionStorage.setItem("techit:trust-center-intro:dismissed", "1"); } catch { /* storage unavailable */ } };

  const decideAccess = async (requestId: string, decision: "approved" | "rejected") => {
    setBusySource(requestId);
    try {
      await decideFounderTrustAccessRequest(requestId, decision);
      await load();
    } finally {
      setBusySource(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-cyan-700">
            <ShieldCheck className="w-4 h-4" />
            Trust Engine Lite
          </div>
          <h1 className="mt-1 text-2xl font-bold text-text-primary">Trust Center</h1>
          <p className="mt-1 text-sm text-text-muted">
            Metadata-only verification, expiring badges, immutable history, and founder-only alerts.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void load()} disabled={state === "loading"}>
          <RefreshCw className={state === "loading" ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {!introDismissed && <aside className="flex items-start gap-3 rounded-lg border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" aria-hidden="true" />
        <p className="min-w-0 flex-1"><span className="font-semibold">Why Trust Center matters:</span> verified signals make your founder profile more visible to investors and improve matching quality. Your verification tier controls trust visibility; subscriptions and higher credit purchases expand the amount of matching and metered intelligence you can access. Only approved metadata scopes are shared.</p>
        <button type="button" onClick={dismissIntro} className="shrink-0 rounded p-1 text-cyan-700 hover:bg-cyan-100" aria-label="Dismiss Trust Center note" title="Dismiss note"><X className="h-4 w-4" /></button>
      </aside>}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border-default bg-surface-primary p-5">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-text-secondary">Trust score</p>
              <div className="mt-3 flex items-end gap-3">
                <span className="text-5xl font-bold tabular-nums text-text-primary">{score}</span>
                <span className="pb-2 text-sm text-text-muted">/100</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-violet-200 bg-violet-50 text-violet-700" variant="outline">
                  {profile?.tier ?? "Unverified"}
                </Badge>
                <Badge className={statusClass(String(profile?.verification_status ?? "pending"))} variant="outline">
                  {String(profile?.verification_status ?? "pending")}
                </Badge>
              </div>
            </div>
            <div className="grid min-w-[260px] gap-3 text-sm">
              <div className="rounded-lg border border-border-default p-3">
                <p className="text-xs uppercase tracking-wider text-text-disabled">Active badges</p>
                <p className="mt-1 text-xl font-semibold text-text-primary">{activeBadges.length}</p>
              </div>
              <div className="rounded-lg border border-border-default p-3">
                <p className="text-xs uppercase tracking-wider text-text-disabled">Last sync</p>
                <p className="mt-1 font-medium text-text-primary">{formatDate(profile?.last_sync_at)}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {Object.entries(profile?.breakdown ?? {}).slice(0, 8).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-background-primary p-3">
                <p className="text-xs text-text-muted">{key.replaceAll("_", " ")}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-text-primary">{Math.round(value)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border-default bg-surface-primary p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-secondary">Founder notifications</p>
              <p className="text-xs text-text-muted">{actionRequired.length} item(s) need attention</p>
            </div>
            <Bell className="w-5 h-5 text-status-warning" />
          </div>
          <div className="mt-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="rounded-lg border border-status-success bg-status-success-soft p-3 text-sm text-status-success">
                No Trust alerts right now.
              </div>
            ) : (
              notifications.slice(0, 4).map((notification) => (
                <div key={notification.notification_id} className="rounded-lg border border-border-default p-3">
                  <div className="flex items-start gap-2">
                    {notification.severity === "critical" ? (
                      <AlertTriangle className="mt-0.5 w-4 h-4 text-rose-500" />
                    ) : notification.action_required ? (
                      <Clock className="mt-0.5 w-4 h-4 text-status-warning" />
                    ) : (
                      <CheckCircle2 className="mt-0.5 w-4 h-4 text-status-success" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{notification.message}</p>
                      <p className="mt-1 text-xs text-text-muted">
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

      <section className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">Investor access requests</h2>
            <p className="mt-1 text-xs text-text-muted">Approve only metadata scopes you are prepared to share with an investor.</p>
          </div>
        </div>
        <div className="space-y-3">
          {accessRequests.length === 0 ? <div className="rounded-lg border border-dashed border-border-strong p-4 text-sm text-text-muted">No pending investor access requests.</div> : accessRequests.map((request) => <div key={request.id} className="rounded-lg border border-border-default p-4"><p className="font-medium text-text-primary">Investor {request.investorId}</p><p className="mt-1 text-sm text-text-muted">{request.purpose || "Investment due diligence"}</p><p className="mt-2 text-xs text-text-disabled">Startup {request.projectId} · {request.requestedScopes.join(", ")}</p><div className="mt-3 flex gap-2"><Button size="sm" disabled={busySource === request.id} onClick={() => void decideAccess(request.id, "approved")}>Approve</Button><Button size="sm" variant="outline" disabled={busySource === request.id} onClick={() => void decideAccess(request.id, "rejected")}>Reject</Button></div></div>)}
        </div>
      </section>

      <section className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600" />
              <h2 className="text-sm font-semibold text-text-secondary">Verification badges</h2>
            </div>
            <p className="mt-1 text-xs text-text-muted">Badges expire with their source verification.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {badges.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong p-4 text-sm text-text-muted">
              No active Trust badges yet.
            </div>
          ) : (
            badges.map((badge) => (
              <div key={`${badge.badge_type}-${badge.source}`} className="rounded-lg border border-border-default p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-text-primary">{badge.label}</p>
                    <p className="mt-1 text-xs text-text-muted">{sourceLabels[badge.source] ?? badge.source}</p>
                  </div>
                  <Badge className={statusClass(String(badge.status))} variant="outline">
                    {badge.active === false ? "expired" : badge.status}
                  </Badge>
                </div>
                <p className="mt-4 text-xs text-text-muted">Expires {formatDate(badge.expires_at)}</p>
              </div>
            ))
          )}
        </div>
        {expiringBadges.length > 0 && (
          <div className="mt-4 rounded-lg border border-status-warning bg-status-warning-soft p-3 text-sm text-status-warning">
            Next expiry: {expiringBadges[0].label} on {formatDate(expiringBadges[0].expires_at)}.
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-600" />
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">Connected verification sources</h2>
            <p className="mt-1 text-xs text-text-muted">Manual re-verification and disconnect controls.</p>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {integrations.map((manifest) => {
            const latest = latestBySource.get(manifest.source);
            const disabled = busySource === manifest.source;
            return (
              <div key={manifest.provider} className="rounded-lg border border-border-default p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-text-primary">{manifest.display_name}</p>
                      <Badge className={statusClass(String(latest?.status ?? "pending"))} variant="outline">
                        {latest?.status ?? "not verified"}
                      </Badge>
                      <Badge className="border-border-default bg-background-primary text-text-muted" variant="outline">
                        {formatFrequency(manifest.sync_frequency_seconds)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">{manifest.access_description}</p>
                    <p className="mt-2 text-xs text-text-muted">{manifest.storage_description}</p>
                    <p className="mt-3 text-xs text-text-disabled">
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
                    >
                      <RefreshCw className={disabled ? "animate-spin" : ""} />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void disconnectSource(manifest.source)}
                      disabled={disabled || !manifest.revocation_supported}
                    >
                      <Unplug />
                      Disconnect
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {manifest.stored_fields.slice(0, 5).map((field) => (
                    <span key={field} className="rounded bg-surface-secondary px-2 py-1 text-xs text-text-muted">
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-violet-600" />
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">Connect a Source</h2>
            <p className="mt-1 text-xs text-text-muted">Initiate verification for sources not yet connected.</p>
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
              <div className="rounded-lg border border-dashed border-violet-200 bg-violet-50 p-4 text-sm text-violet-700">
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
                    className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 p-4"
                  >
                    <p className="font-medium text-violet-700">
                      {sourceLabels[source] ?? source}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-violet-200 text-violet-700 hover:bg-violet-100"
                      disabled={disabled}
                      onClick={async () => {
                        setBusySource(source);
                        try {
                          if (source === "domain" || source === "website") {
                            const domain = window.prompt("Enter the founder website domain to verify");
                            if (!domain) return;
                            const method = source === "website" ? "https" : "dns_txt";
                            const challenge = await createTrustDomainChallenge({ domain, method }) as { challenge?: { id?: string }; token?: string; instructions?: string };
                            toast.success("Verification challenge created", {
                              description: `${challenge.instructions ?? "Publish the verification token, then refresh."} Token: ${challenge.token ?? "hidden"}`,
                              duration: 12000,
                            });
                            if (challenge.challenge?.id && window.confirm("After publishing the token, verify this domain now?")) {
                              const result = await verifyTrustDomainChallenge(challenge.challenge.id) as { verified?: boolean };
                              toast[result.verified ? "success" : "info"](result.verified ? "Domain verified" : "Verification is still pending");
                            }
                            await load();
                            return;
                          }
                          const result = await connectTrustSource(source);
                          const authorizationUrl = typeof result.authorizationUrl === "string"
                            ? result.authorizationUrl
                            : null;
                          if (authorizationUrl) {
                            window.location.assign(authorizationUrl);
                            return;
                          }
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
                        <RefreshCw className="animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
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

      <section className="rounded-xl border border-border-default bg-surface-primary p-5">
        <div className="mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-text-muted" />
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">Immutable Trust timeline</h2>
            <p className="mt-1 text-xs text-text-muted">Append-only verification history with metadata hashes.</p>
          </div>
        </div>
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border-strong p-4 text-sm text-text-muted">
              No Trust timeline entries yet.
            </div>
          ) : (
            history.map((item) => (
              <div key={item.verification_id} className="grid gap-3 rounded-lg border border-border-default p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-text-primary">{item.event_type || `${item.source}_${item.status}`}</p>
                    <Badge className={statusClass(String(item.status))} variant="outline">
                      {item.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-text-muted">
                    {sourceLabels[item.source] ?? item.source} · created {formatDate(item.created_at)} · expires {formatDate(item.expires_at)}
                  </p>
                  <p className="mt-2 text-xs text-text-disabled">
                    Hash: {item.metadata_hash ? `${item.metadata_hash.slice(0, 18)}...` : "none"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Lock className="w-3 h-3" />
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
