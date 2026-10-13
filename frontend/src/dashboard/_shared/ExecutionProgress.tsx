import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lock, TrendingDown, TrendingUp } from 'lucide-react';
import { evaluatePaywall, type TvceDecision } from '@/lib/api/tvce';
import type { ExecutionIntelligenceView } from '@/lib/api/executionIntelligence';

/**
 * Subscriber visual for execution progress. The text stats stay free; this
 * richer view (baseline vs now, a daily sparkline and cumulative totals) reuses
 * the existing TVCE entitlement — no new tier or capability is introduced.
 */
const VISUAL_CAPABILITY = 'ADVANCED_WORKSPACE_AI';

type Progress = ExecutionIntelligenceView['progress'];

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return <div className="h-10 rounded bg-surface-secondary" aria-hidden />;
  }
  const max = Math.max(1, ...points);
  const step = 100 / (points.length - 1);
  const coords = points
    .map((value, index) => `${(index * step).toFixed(2)},${(30 - (value / max) * 28).toFixed(2)}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="h-10 w-full" role="img" aria-label="Daily execution events">
      <polyline points={coords} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-brand-primary" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function DeltaChip({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
        positive ? 'border-emerald-500/40 text-emerald-400' : 'border-amber-500/40 text-amber-400'
      }`}
    >
      <Icon className="h-3 w-3" />
      {positive ? '+' : ''}{value} {label}
    </span>
  );
}

export function ExecutionProgress({ progress }: { progress: Progress }) {
  const [decision, setDecision] = useState<TvceDecision | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let alive = true;
    evaluatePaywall({ capability: VISUAL_CAPABILITY })
      .then((result) => { if (alive) setDecision(result); })
      .catch(() => { if (alive) setDecision(null); })
      .finally(() => { if (alive) setChecked(true); });
    return () => { alive = false; };
  }, []);

  if (!checked) {
    return <div className="mt-4 h-24 animate-pulse rounded-lg bg-surface-secondary" />;
  }

  if (decision?.allowed !== true) {
    return (
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-secondary px-3 py-3">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Lock className="h-4 w-4" />
          <span>Progress visual (baseline vs. now, sparkline and cumulative totals) is a subscriber view.</span>
        </div>
        <Link to="/wallet" className="shrink-0 rounded-md border border-border-default px-3 py-1.5 text-sm text-text-primary">
          Unlock
        </Link>
      </div>
    );
  }

  const { lifetime, baseline, delta, perDay, cumulative } = progress;
  return (
    <div className="mt-4 rounded-lg border border-border-subtle bg-surface-secondary p-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <DeltaChip label="events vs first week" value={delta.events} />
        <DeltaChip label="artifacts" value={delta.artifacts} />
        <DeltaChip label="active actors" value={delta.activeActors} />
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
          <span>Daily events ({perDay.length} active days)</span>
          <span>{cumulative.eventsPerActiveDay.toFixed(1)} / active day</span>
        </div>
        <Sparkline points={perDay.map((row) => row.events)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-muted sm:grid-cols-4">
        <span>Lifetime events: <strong className="text-text-primary">{lifetime.events}</strong></span>
        <span>Artifacts: <strong className="text-text-primary">{lifetime.artifacts}</strong></span>
        <span>Projects: <strong className="text-text-primary">{lifetime.projects}</strong></span>
        <span>Span: <strong className="text-text-primary">{cumulative.spanDays}d</strong></span>
      </div>
      <p className="mt-2 text-xs text-text-disabled">
        Baseline = the first week ({baseline.events} events{baseline.at ? ` from ${new Date(baseline.at).toLocaleDateString()}` : ''}).
      </p>
    </div>
  );
}
