import { useEffect, useState } from 'react';
import { Wallet, Plus, TrendingUp, CheckCircle, Sparkles } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Capital Pools & Micro-Funds
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Automated Release
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Milestone-based capital deployment and rule-driven syndicate pooling
            </p>
          </div>
          <button className="px-4 py-2.5 bg-[#20C997] hover:bg-[#1cb084] text-slate-950 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Create New Pool
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading live capital pools...
          </div>
        ) : pools.length === 0 ? (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/[0.06]">
              <Wallet className="h-6 w-6 text-[#20C997]" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No live capital pools yet</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto">
              Capital pools will appear here after they are created and persisted for this investor account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}

            {/* Create Pool Card */}
            <div className="bg-white dark:bg-[#111111] border-2 border-dashed border-slate-300 dark:border-white/20 rounded-2xl p-8 flex flex-col items-center justify-center hover:border-[#20C997] transition-all cursor-pointer group shadow-sm min-h-[300px]">
              <div className="p-4 bg-slate-100 dark:bg-white/[0.06] group-hover:bg-[#20C997]/15 rounded-2xl mb-4 transition-colors">
                <Plus className="w-8 h-8 text-slate-400 group-hover:text-[#20C997] transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Create New Pool</h3>
              <p className="text-slate-500 dark:text-slate-400 text-center text-xs max-w-xs">
                Set up automated capital deployment with custom rules and milestone triggers
              </p>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#20C997]" /> How Milestone-Based Capital Deployment Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
    <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 hover:border-[#20C997]/40 transition-all shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{pool.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pool.startups} startups · {pool.milestonesHit} milestones completed
            </p>
          </div>
          <div className="p-2.5 bg-[#20C997]/15 rounded-xl">
            <Wallet className="w-5 h-5 text-[#20C997]" />
          </div>
        </div>

        {/* Capital Stats */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-black/[0.04] dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">Total Capital</p>
            <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
              ${(totalCapital / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-white/[0.03] p-3 rounded-xl border border-black/[0.04] dark:border-white/5">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 font-medium">ROI Simulation</p>
            <p className="text-2xl font-bold font-mono text-[#20C997]">{pool.roiSimulation}x</p>
          </div>
        </div>

        {/* Deployment Progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Capital Deployed</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">{deployedPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#20C997]"
              style={{ width: `${deployedPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            ${(deployed / 1000).toFixed(0)}K of ${(totalCapital / 1000).toFixed(0)}K deployed
          </p>
        </div>

        {/* Funds Released */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5 text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Funds Released (Milestones)</span>
            <span className="font-mono font-bold text-[#20C997]">{releasedPercentage.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${releasedPercentage}%` }}
            ></div>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
            ${(fundsReleased / 1000).toFixed(0)}K released on milestone completion
          </p>
        </div>

        {/* Rules */}
        <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl mb-5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2.5 uppercase tracking-wider">Pool Rules</h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Min Readiness</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{rules.minReadiness}+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Max Per Startup</span>
              <span className="text-slate-900 dark:text-white font-mono font-bold">{rules.maxPerStartup}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Milestone Trigger</span>
              <div className="flex items-center gap-1 text-[#20C997]">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-black/[0.04] dark:border-white/5">
        <button className="flex-1 py-2.5 bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all">
          View Details
        </button>
        <button className="flex-1 py-2.5 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5" />
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
    <div className="text-center bg-white dark:bg-[#111111] p-4 rounded-xl border border-black/[0.04] dark:border-white/5 shadow-sm">
      <div className="w-9 h-9 bg-[#20C997]/15 rounded-full flex items-center justify-center mx-auto mb-2">
        <span className="text-[#20C997] font-bold text-sm">{number}</span>
      </div>
      <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-1">{title}</h4>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{description}</p>
    </div>
  );
}
