import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CalendarClock, CircleDollarSign, RefreshCw, Rocket, UsersRound, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrganizationEntitlements, type TvceDecision } from "@/lib/api/tvce";
import { fetchOrganizationIntelligenceOverview, type OrganizationIntelligenceOverview } from "@/lib/api/organizationIntelligence";

const visibleCapabilities = new Set([
  "ORGANIZATION_PROGRAM_SETUP",
  "ORGANIZATION_HACKATHON_BASIC",
  "ORGANIZATION_MONITORING",
  "COHORT_INTELLIGENCE",
  "ORGANIZATION_PROGRAM_ANALYTICS",
]);

export function OrganizationLicensingPanel() {
  const { activeContext } = useAuth();
  const organizationId = activeContext?.organizationId || null;
  const [rows, setRows] = useState<TvceDecision[]>([]);
  const [plan, setPlan] = useState<string>("community_host");
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<OrganizationIntelligenceOverview | null>(null);

  const load = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const [result, commercialOverview] = await Promise.all([
        fetchOrganizationEntitlements(organizationId),
        fetchOrganizationIntelligenceOverview(),
      ]);
      setRows(result.entitlements.filter((row) => visibleCapabilities.has(row.capability)));
      setOverview(commercialOverview);
      const entitlement = result.entitlements.find((row) => row.organizationEntitlement)?.organizationEntitlement;
      if (commercialOverview.commercial?.plan) setPlan(commercialOverview.commercial.plan);
      else if (entitlement?.plan) setPlan(entitlement.plan);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [organizationId]);

  const summary = useMemo(() => rows.reduce((value, row) => value + (row.allowed ? 1 : 0), 0), [rows]);
  if (!organizationId) return null;
  const commercial = overview?.commercial;
  const expiry = commercial?.expiresAt ? new Date(commercial.expiresAt).toLocaleDateString() : "No expiry";
  const remainingCredits = commercial?.budgets.reduce((sum, budget) => sum + budget.remaining, 0) || 0;

  return (
    <section className="mb-6 rounded-lg border border-border-default bg-surface-primary p-5" aria-label="Organization licensing">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-status-info-soft p-2 text-status-info"><WalletCards className="h-5 w-5" /></div>
          <div><p className="text-sm font-semibold text-text-primary">Organization access</p><p className="text-xs text-text-muted">{plan.replaceAll("_", " ")} · {summary}/{rows.length || 0} available</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded border border-border-strong px-3 py-2 text-xs font-medium text-text-secondary hover:bg-background-primary disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
      {rows.length > 0 && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <div key={row.capability} className="flex items-center justify-between gap-3 rounded border border-border-subtle px-3 py-2"><span className="text-xs text-text-secondary">{row.capability.replaceAll("_", " ")}</span>{row.allowed ? <BadgeCheck className="h-4 w-4 text-status-success" aria-label="Available" /> : <span className="text-[11px] text-status-warning">{row.code.replaceAll("_", " ")}</span>}</div>)}</div>}
      {commercial && <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded border border-border-subtle p-3"><div className="flex items-center gap-2 text-xs text-text-muted"><CalendarClock className="h-3.5 w-3.5" />Expiry</div><p className="mt-1 text-sm font-semibold text-text-primary">{expiry}</p><p className="text-[11px] text-text-muted">{commercial.status.replaceAll("_", " ")}</p></div>
        <div className="rounded border border-border-subtle p-3"><div className="flex items-center gap-2 text-xs text-text-muted"><CircleDollarSign className="h-3.5 w-3.5" />Credits remaining</div><p className="mt-1 text-sm font-semibold text-text-primary">{remainingCredits.toLocaleString()}</p><p className="text-[11px] text-text-muted">{commercial.usageCredits.toLocaleString()} used</p></div>
        <div className="rounded border border-border-subtle p-3"><div className="flex items-center gap-2 text-xs text-text-muted"><UsersRound className="h-3.5 w-3.5" />Sponsors</div><p className="mt-1 text-sm font-semibold text-text-primary">{commercial.sponsorApplications}</p><p className="text-[11px] text-text-muted">{commercial.sponsorPackages} packages</p></div>
        <div className="rounded border border-border-subtle p-3"><div className="flex items-center gap-2 text-xs text-text-muted"><Rocket className="h-3.5 w-3.5" />Conversion</div><p className="mt-1 text-sm font-semibold text-text-primary">{commercial.conversion?.completedCandidates || 0}/{commercial.startupCandidates}</p><p className="text-[11px] text-text-muted">startup candidates</p></div>
      </div>}
      {commercial && <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/org/incubator" className="inline-flex items-center gap-2 rounded border border-border-strong px-3 py-2 text-xs font-medium text-text-secondary hover:bg-background-primary"><Rocket className="h-3.5 w-3.5" />Continue program</Link>
        <Link to="/org/billing" className="inline-flex items-center gap-2 rounded bg-action-primary px-3 py-2 text-xs font-medium text-white hover:bg-action-primary-hover"><WalletCards className="h-3.5 w-3.5" />Upgrade organization</Link>
      </div>}
    </section>
  );
}
