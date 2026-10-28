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
  const remainingCredits = Array.isArray(commercial?.budgets) ? commercial.budgets.reduce((sum: number, budget: { remaining?: number }) => sum + (budget.remaining || 0), 0) : 0;


  return (
    <section className="mb-6 rounded-2xl border border-teal-500/20 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl" aria-label="Organization licensing">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-teal-500/10 p-2.5 text-teal-400 ring-1 ring-teal-500/20"><WalletCards className="h-5 w-5" /></div>
          <div><p className="font-bricolage text-base font-bold text-slate-100">Organization access</p><p className="text-xs text-slate-400 capitalize">{plan.replaceAll("_", " ")} · <span className="text-teal-400 font-semibold">{summary}/{rows.length || 0}</span> capabilities active</p></div>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:border-teal-500/40 hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
      {rows.length > 0 && <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">{rows.map((row) => <div key={row.capability} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 px-3.5 py-2.5"><span className="text-xs text-slate-300 font-medium">{row.capability.replaceAll("_", " ")}</span>{row.allowed ? <BadgeCheck className="h-4 w-4 text-teal-400" aria-label="Available" /> : <span className="text-[11px] font-semibold text-amber-400">{row.code.replaceAll("_", " ")}</span>}</div>)}</div>}
      {commercial && <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><CalendarClock className="h-3.5 w-3.5 text-teal-400" />Expiry</div><p className="mt-1 text-sm font-bold text-slate-100">{expiry}</p><p className="text-[11px] text-slate-400 capitalize">{commercial.status.replaceAll("_", " ")}</p></div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><CircleDollarSign className="h-3.5 w-3.5 text-teal-400" />Credits remaining</div><p className="mt-1 text-sm font-bold text-teal-400">{remainingCredits.toLocaleString()}</p><p className="text-[11px] text-slate-400">{commercial.usageCredits.toLocaleString()} used</p></div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><UsersRound className="h-3.5 w-3.5 text-teal-400" />Sponsors</div><p className="mt-1 text-sm font-bold text-slate-100">{commercial.sponsorApplications}</p><p className="text-[11px] text-slate-400">{commercial.sponsorPackages} packages</p></div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5"><div className="flex items-center gap-2 text-xs text-slate-400"><Rocket className="h-3.5 w-3.5 text-teal-400" />Conversion</div><p className="mt-1 text-sm font-bold text-slate-100">{commercial.conversion?.completedCandidates || 0}/{commercial.startupCandidates}</p><p className="text-[11px] text-slate-400">startup candidates</p></div>
      </div>}
      {commercial && <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/org/incubator" className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-teal-500/40 hover:bg-slate-800 transition-all shadow-md"><Rocket className="h-3.5 w-3.5 text-teal-400" />Continue program</Link>
        <Link to="/org/billing" className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-teal-400 transition-colors shadow-lg shadow-teal-500/20"><WalletCards className="h-3.5 w-3.5" />Upgrade organization</Link>
      </div>}
    </section>
  );
}
