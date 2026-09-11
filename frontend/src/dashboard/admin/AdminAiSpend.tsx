import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Coins, Database, RefreshCw, ShieldCheck, TrendingUp, WalletCards } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { fetchAdminTvceAnalytics, type AdminTvceAnalytics } from '@/lib/api/tvce';

const number = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Number(value) || 0);
const money = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(Number(value) || 0);
const percent = (value: number | null) => value === null || !Number.isFinite(value) ? '—' : `${(value * 100).toFixed(1)}%`;

function Metric({ label, value, detail, icon: Icon, tone = 'default' }: { label: string; value: string; detail: string; icon: typeof Activity; tone?: 'default' | 'good' | 'warn' | 'danger' }) {
  const tones = { default: 'border-border bg-card', good: 'border-emerald-500/30 bg-emerald-500/5', warn: 'border-amber-500/30 bg-amber-500/5', danger: 'border-red-500/30 bg-red-500/5' };
  const iconTones = { default: 'text-primary', good: 'text-emerald-600 dark:text-emerald-400', warn: 'text-amber-600 dark:text-amber-400', danger: 'text-red-600 dark:text-red-400' };
  return <article className={`rounded-lg border p-4 ${tones[tone]}`}><div className="flex items-center justify-between gap-3"><span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span><Icon className={`h-4 w-4 ${iconTones[tone]}`} /></div><p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></article>;
}

function AdminAccessDenied() {
  return <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center"><ShieldCheck className="h-10 w-10 text-muted-foreground" /><h1 className="mt-4 text-xl font-semibold">Admin access required</h1><p className="mt-2 text-sm text-muted-foreground">This view is restricted to authorized TechIT administrators.</p></main>;
}

export default function AdminAiSpend() {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<AdminTvceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (manual = false) => {
    manual ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      setData(await fetchAdminTvceAnalytics(period));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setError('admin');
      else if (cause instanceof ApiError && cause.status === 403) setError('admin');
      else setError('Unable to load AI spend analytics.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [period]);

  useEffect(() => { void load(); }, [load]);

  const providers = useMemo(() => {
    if (!data) return [];
    return [...data.providerModelBreakdown].sort((a, b) => b.providerCostUsd - a.providerCostUsd);
  }, [data]);

  if (error === 'admin') return <AdminAccessDenied />;
  if (loading && !data) return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><div className="h-8 w-64 animate-pulse rounded bg-muted" /><div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-lg bg-muted" />)}</div></main>;
  if (!data) return <main className="mx-auto max-w-xl px-6 py-20 text-center"><AlertTriangle className="mx-auto h-8 w-8 text-amber-500" /><h1 className="mt-4 text-lg font-semibold">Analytics unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error || 'No analytics response was returned.'}</p><button type="button" onClick={() => void load(true)} className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Retry</button></main>;

  const metrics = data.metrics;
  const spend = metrics.aiTokenSpend;
  const marginTone = metrics.usageGrossMargin === null ? 'default' : metrics.usageGrossMargin < 0.5 ? 'danger' : metrics.usageGrossMargin < 0.6 ? 'warn' : 'good';

  return <main className="min-h-screen bg-background"><div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2 text-primary"><Activity className="h-5 w-5" /><span className="text-sm font-medium">Finance operations</span></div><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">AI token spend</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Monitor token consumption, provider cost, wallet capacity, and margin from persisted TVCE usage events.</p></div><div className="flex items-center gap-2"><select aria-label="Analytics period" value={period} onChange={(event) => setPeriod(event.target.value)} className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option><option value="all">All time</option></select><button type="button" onClick={() => void load(true)} disabled={refreshing} aria-label="Refresh analytics" className="inline-flex min-h-10 items-center justify-center rounded-md border border-input px-3 text-sm hover:bg-muted disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /></button></div></header>
    <section aria-label="AI spend summary" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total tokens" value={number(spend.totalTokens)} detail={`${number(metrics.usageEvents)} persisted usage events`} icon={Database} /><Metric label="Provider spend" value={money(spend.providerCostUsd)} detail={`${money(spend.infrastructureCostUsd)} infrastructure`} icon={Coins} /><Metric label="Credits settled" value={number(spend.creditsSettled)} detail={`${number(spend.freeCapabilityUses)} free capability uses`} icon={WalletCards} /><Metric label="Gross margin" value={percent(metrics.usageGrossMargin)} detail={`${money(metrics.usageGrossProfitUsd)} gross profit`} icon={TrendingUp} tone={marginTone} /></section>
    <section aria-label="Token breakdown" className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Input tokens" value={number(spend.inputTokens)} detail="Prompt/context tokens" icon={Activity} /><Metric label="Output tokens" value={number(spend.outputTokens)} detail="Generated completion tokens" icon={Activity} /><Metric label="Cached input" value={number(spend.cachedInputTokens)} detail="Cache-assisted input tokens" icon={Activity} /><Metric label="Available wallet" value={number(metrics.wallet.availableCredits)} detail={`${number(metrics.wallet.reservedCredits)} currently reserved`} icon={WalletCards} /></section>
    <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-semibold text-foreground">Provider and model spend</h2><p className="mt-1 text-xs text-muted-foreground">Actual usage telemetry and provider COGS for the selected period.</p></div><span className="text-xs text-muted-foreground">{data.period}</span></div>{providers.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Provider / model</th><th className="px-5 py-3 font-medium">Calls</th><th className="px-5 py-3 font-medium">Tokens</th><th className="px-5 py-3 font-medium">Credits</th><th className="px-5 py-3 font-medium">Provider COGS</th></tr></thead><tbody className="divide-y divide-border">{providers.map((row) => <tr key={`${row.provider}:${row.model}`}><td className="px-5 py-3"><p className="font-medium text-foreground">{row.provider}</p><p className="text-xs text-muted-foreground">{row.model}</p></td><td className="px-5 py-3 text-muted-foreground">{number(row.calls)}</td><td className="px-5 py-3 text-muted-foreground">{number(row.totalTokens)}</td><td className="px-5 py-3 text-muted-foreground">{number(row.credits)}</td><td className="px-5 py-3 font-medium text-foreground">{money(row.providerCostUsd)}</td></tr>)}</tbody></table></div> : <div className="px-5 py-12 text-center text-sm text-muted-foreground">No provider usage has been recorded for this period.</div>}</div>
      <div className="space-y-4"><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-primary" /><h2 className="font-semibold text-foreground">Capacity</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Gross wallet credits</dt><dd className="font-medium">{number(metrics.wallet.grossCredits)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Reserved credits</dt><dd className="font-medium">{number(metrics.wallet.reservedCredits)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Available credits</dt><dd className="font-medium text-emerald-600 dark:text-emerald-400">{number(metrics.wallet.availableCredits)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Active subscriptions</dt><dd className="font-medium">{number(metrics.wallet.activeSubscriptionAccounts)}</dd></div></dl></div><div className="rounded-lg border border-border bg-card p-5"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /><h2 className="font-semibold text-foreground">Margin health</h2></div><dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Variable cost</dt><dd className="font-medium">{money(spend.totalVariableCostUsd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Usage revenue</dt><dd className="font-medium">{money(metrics.usageRevenueUsd)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Warnings</dt><dd className="font-medium text-amber-600 dark:text-amber-400">{number(metrics.marginWarnings)}</dd></div><div className="flex justify-between gap-4"><dt className="text-muted-foreground">Critical</dt><dd className="font-medium text-red-600 dark:text-red-400">{number(metrics.marginCritical)}</dd></div></dl></div></div></section>
    <footer className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>Source: persisted TVCE usage and finance records</span><span>Updated {new Date(data.generatedAt).toLocaleString()}</span></footer>
  </div></main>;
}
