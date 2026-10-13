import { useEffect, useState } from 'react';
import { Briefcase, Boxes, Flag, PackageCheck, Rocket } from 'lucide-react';
import { fetchPlatformMetrics, type PlatformMetrics } from '@/lib/api/organization';

function Cell({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-primary px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

/**
 * Phase M: platform execution metrics (startups built, prototypes, MVPs,
 * launches, milestones) read from the single aggregate ledger endpoint. Renders
 * on every dashboard that hosts the execution-intelligence panel; the server
 * scopes the per-founder breakdown to organizations/admins.
 */
export function PlatformMetricsStrip({ className = '' }: { className?: string }) {
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlatformMetrics()
      .then((next) => { if (!cancelled) setMetrics(next); })
      .catch(() => { if (!cancelled) setMetrics(null); });
    return () => { cancelled = true; };
  }, []);

  if (!metrics) return null;
  const totals = metrics.totals;
  const heading = metrics.scope === 'platform' ? 'Platform execution' : metrics.scope === 'organization' ? 'Program execution' : 'Your execution';
  const scopeNote = metrics.scope === 'platform'
    ? `${totals.startups} startups · ${totals.founders} founders`
    : metrics.scope === 'organization'
      ? `${totals.startups} startups in your programs`
      : `${totals.startups} startups`;

  return (
    <section className={`rounded-xl border border-border-default bg-surface-primary p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-semibold">{heading}</h3>
        <span className="text-xs text-text-disabled">{scopeNote}</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Cell icon={<Briefcase className="h-3.5 w-3.5" />} label="Startups" value={String(totals.startups)} />
        <Cell icon={<Boxes className="h-3.5 w-3.5" />} label="Prototypes" value={String(totals.prototypes)} />
        <Cell icon={<PackageCheck className="h-3.5 w-3.5" />} label="MVPs" value={String(totals.mvpCompleted)} />
        <Cell icon={<Rocket className="h-3.5 w-3.5" />} label="Launched" value={String(totals.productsLaunched)} />
        <Cell icon={<Flag className="h-3.5 w-3.5" />} label="Milestones" value={`${totals.completedMilestones}/${totals.milestones}`} />
      </div>
      {metrics.scope === 'founder' && metrics.founder && (
        <p className="mt-3 text-xs text-text-disabled">
          Your progress: {metrics.founder.startups} startups · {metrics.founder.mvpCompleted} MVPs ·{' '}
          {metrics.founder.productsLaunched} launched · {metrics.founder.completedMilestones} milestones done.
        </p>
      )}
    </section>
  );
}
