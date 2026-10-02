import { useEffect, useState } from 'react';
import { Wallet, Plus, TrendingUp, CheckCircle } from 'lucide-react';
import { fetchCapitalPools, type CapitalPool } from '@/lib/api/capitalPools';

export function CapitalPools() {
  const [pools, setPools] = useState<CapitalPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCapitalPools()
      .then((data) => {
        if (!alive) return;
        setPools(data);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live capital pools.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  return (
    <div className="min-h-screen bg-background-inverse">
      {/* Header */}
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Capital Pools</h1>
            <p className="text-text-on-inverse-muted mt-1">
              Automated milestone-based capital deployment · Build micro funds
            </p>
          </div>
          <button className="px-4 py-2 bg-status-success hover:bg-status-success text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create New Pool
          </button>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-8 text-center text-text-on-inverse-muted">
            Loading live capital pools...
          </div>
        ) : pools.length === 0 ? (
          <div className="rounded-lg border border-border-inverse bg-surface-inverse p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-inverse-muted">
              <Wallet className="h-6 w-6 text-text-on-inverse-muted" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No live capital pools yet</h3>
            <p className="text-text-on-inverse-muted text-sm">
              Capital pools will appear here after they are created and persisted for this investor account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}

            {/* Create Pool Card */}
            <div className="bg-surface-inverse border-2 border-dashed border-border-inverse-strong rounded-lg p-8 flex flex-col items-center justify-center hover:border-status-success/50 transition-colors cursor-pointer group">
              <div className="p-4 bg-surface-inverse-muted group-hover:bg-status-success/10 rounded-full mb-4 transition-colors">
                <Plus className="w-8 h-8 text-text-on-inverse-muted group-hover:text-status-success transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create New Pool</h3>
              <p className="text-text-on-inverse-muted text-center text-sm">
                Set up automated capital deployment with custom rules and milestone triggers
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-8 bg-gradient-to-br from-status-pending/10 to-brand-primary/10 border border-status-pending/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            How Milestone-Based Capital Deployment Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Step number="1" title="Define Pool" description="Set total capital and investment criteria" />
            <Step number="2" title="Select Startups" description="Choose eligible startups above readiness threshold" />
            <Step number="3" title="Set Milestones" description="Define trigger points for capital release" />
            <Step number="4" title="Auto-Deploy" description="Funds released automatically when milestones hit" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface PoolCardProps {
  pool: CapitalPool;
}

function PoolCard({ pool }: PoolCardProps) {
  const totalCapital = Number(pool.totalCapital ?? 0);
  const deployed = Number(pool.deployed ?? 0);
  const fundsReleased = Number(pool.fundsReleased ?? 0);
  const deployedPercentage = totalCapital > 0 ? Math.min(100, (deployed / totalCapital) * 100) : 0;
  const releasedPercentage = deployed > 0 ? Math.min(100, (fundsReleased / deployed) * 100) : 0;
  const rules = {
    minReadiness: Number(pool.rules?.minReadiness ?? 0),
    maxPerStartup: Number(pool.rules?.maxPerStartup ?? 0),
    milestoneTrigger: Boolean(pool.rules?.milestoneTrigger),
  };

  return (
    <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6 hover:border-border-inverse-strong transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">{pool.name}</h3>
          <p className="text-sm text-text-on-inverse-muted">
            {pool.startups} startups · {pool.milestonesHit} milestones completed
          </p>
        </div>
        <div className="p-2 bg-status-pending/20 rounded-lg">
          <Wallet className="w-5 h-5 text-status-pending" />
        </div>
      </div>

      {/* Capital Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-text-on-inverse-muted mb-1">Total Capital</p>
          <p className="text-2xl font-bold font-mono text-white">
            ${(totalCapital / 1000).toFixed(0)}K
          </p>
        </div>
        <div>
          <p className="text-sm text-text-on-inverse-muted mb-1">ROI Simulation</p>
          <p className="text-2xl font-bold font-mono text-status-success">{pool.roiSimulation}x</p>
        </div>
      </div>

      {/* Deployment Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-on-inverse-muted">Capital Deployed</span>
          <span className="text-sm font-mono text-white">{deployedPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-surface-inverse-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-status-pending to-brand-primary"
            style={{ width: `${deployedPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-text-on-inverse-muted mt-1">
          ${(deployed / 1000).toFixed(0)}K of ${(totalCapital / 1000).toFixed(0)}K deployed
        </p>
      </div>

      {/* Funds Released */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-text-on-inverse-muted">Funds Released (Milestone-Based)</span>
          <span className="text-sm font-mono text-status-success">{releasedPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-surface-inverse-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-status-success"
            style={{ width: `${releasedPercentage}%` }}
          ></div>
        </div>
        <p className="text-xs text-text-on-inverse-muted mt-1">
          ${(fundsReleased / 1000).toFixed(0)}K released on milestone completion
        </p>
      </div>

      {/* Rules */}
      <div className="p-4 bg-surface-inverse-muted/50 rounded-lg mb-4">
        <h4 className="text-sm font-semibold text-white mb-3">Pool Rules</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-on-inverse-muted">Min Readiness</span>
            <span className="text-white font-mono">{rules.minReadiness}+</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-on-inverse-muted">Max Per Startup</span>
            <span className="text-white font-mono">{rules.maxPerStartup}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-on-inverse-muted">Milestone Trigger</span>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-status-success" />
              <span className="text-status-success">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button className="flex-1 py-2 bg-status-pending/10 hover:bg-status-pending/20 text-status-pending text-sm font-medium rounded transition-all">
          View Details
        </button>
        <button className="flex-1 py-2 bg-status-success/10 hover:bg-status-success/20 text-status-success text-sm font-medium rounded transition-all flex items-center justify-center gap-1">
          <TrendingUp className="w-4 h-4" />
          Analytics
        </button>
      </div>
    </div>
  );
}

interface StepProps {
  number: string;
  title: string;
  description: string;
}

function Step({ number, title, description }: StepProps) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-status-pending/20 rounded-full flex items-center justify-center mx-auto mb-3">
        <span className="text-status-pending font-bold">{number}</span>
      </div>
      <h4 className="font-semibold text-white mb-1">{title}</h4>
      <p className="text-sm text-text-on-inverse-muted">{description}</p>
    </div>
  );
}
