import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, RefreshCw, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchOrganizationEntitlements, type TvceDecision } from "@/lib/api/tvce";

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

  const load = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const result = await fetchOrganizationEntitlements(organizationId);
      setRows(result.entitlements.filter((row) => visibleCapabilities.has(row.capability)));
      const entitlement = result.entitlements.find((row) => row.organizationEntitlement)?.organizationEntitlement;
      if (entitlement?.plan) setPlan(entitlement.plan);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [organizationId]);

  const summary = useMemo(() => rows.reduce((value, row) => value + (row.allowed ? 1 : 0), 0), [rows]);
  if (!organizationId) return null;

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
    </section>
  );
}
