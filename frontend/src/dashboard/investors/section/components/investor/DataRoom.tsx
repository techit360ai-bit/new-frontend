import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, Lock, Shield, BarChart3, DollarSign, Zap, Database, Sparkles } from 'lucide-react';
import { fetchDataRooms, type DataRoomMeta } from '@/lib/api/dataRooms';
import { fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Metrics Dashboard': BarChart3,
  Financials: DollarSign,
  'Testing Reports': Zap,
  Compliance: Shield,
  Governance: FileText,
  'Execution History': FileText,
  'AI Summary': Zap,
};

function sectionIcon(label: string) {
  return SECTION_ICONS[label] ?? FileText;
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function DataRoom() {
  const { startupId } = useParams();
  const [startup, setStartup] = useState<InvestorStartup | null>(null);
  const [room, setRoom] = useState<DataRoomMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startupId) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    Promise.all([fetchDealFlow(), fetchDataRooms()])
      .then(([dealFlow, dataRooms]) => {
        if (!alive) return;
        setStartup(dealFlow.ranking.find((item) => item.id === startupId) ?? null);
        setRoom(dataRooms.rooms.find((item) => item.projectId === startupId) ?? null);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live data room.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, [startupId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading live data room...
      </div>
    );
  }

  if (!startup && !room) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-[#111111] p-8 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm max-w-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live data room not found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            This project does not have a persisted investor data-room record for the current account.
          </p>
          <Link to="/investor/deal-intelligence" className="inline-flex items-center justify-center px-4 py-2.5 bg-[#20C997] text-slate-950 font-bold rounded-xl text-xs">
            Return to Deal Intelligence
          </Link>
        </div>
      </div>
    );
  }

  const projectId = startupId ?? room?.projectId ?? startup?.id ?? '';
  const name = room?.startupName ?? startup?.name ?? 'Live data room';
  const sector = room?.sector ?? startup?.sector ?? 'Uncategorized';
  const sections = room?.sections ?? [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {name} — Data Room
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Real-Time Telemetry
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Structured due diligence repository and live metric verification
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              disabled={!room}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 px-4 py-2.5 font-semibold text-[#20C997] border border-[#20C997]/20 transition-all hover:bg-[#20C997]/20 disabled:opacity-50 text-xs sm:text-sm"
            >
              <Download className="w-4 h-4" />
              Export Repository
            </button>
            <Link
              to={`/investor/deal-room/${projectId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/10 px-4 py-2.5 font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20 transition-all hover:bg-purple-500/20 text-xs sm:text-sm"
            >
              <Shield className="w-4 h-4" />
              Deal Room
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 shadow-sm self-start">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">SECTIONS</h3>
            {sections.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">No live sections are available yet.</p>
            ) : (
              <nav className="space-y-1.5">
                {sections.map((section, index) => (
                  <TabButton key={section} icon={sectionIcon(section)} label={section} active={index === 0} />
                ))}
              </nav>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Live Metrics Snapshot</h3>
              {startup ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <MetricCard label="Market Readiness Score" value={startup.readinessScore.toString()} />
                    <MetricCard label="Execution Velocity Index" value={startup.executionVelocity.toString()} />
                    <MetricCard label="Beta Retention Rate" value={`${startup.betaRetention}%`} />
                    <MetricCard label="Revenue Growth (MoM)" value={`${startup.revenueGrowth}%`} />
                    <MetricCard label="Monthly Recurring Revenue" value={formatMoney(startup.mrr)} />
                    <MetricCard label="Burn Efficiency Ratio" value={startup.burnEfficiency.toFixed(1)} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Pivot Frequency" value={startup.pivotFrequency} color="text-amber-600 dark:text-amber-400" />
                    <StatCard label="Experiment Velocity" value={`${startup.experimentVelocity}/wk`} color="text-purple-600 dark:text-purple-400" />
                    <StatCard label="Founder Reliability" value={startup.founderReliability} color="text-[#20C997]" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No live deal-flow metrics are attached to this data room yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Data Room Metadata</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Project" value={projectId || '—'} />
                <MetricCard label="Sector" value={sector} />
                <MetricCard label="Documents" value={String(room?.docCount ?? 0)} />
                <MetricCard label="Updated" value={room?.updatedLabel ?? '—'} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Risk Analysis Report</h3>
              {startup ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(startup.riskMetrics).map(([key, value]) => (
                    <div key={key} className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 capitalize">{key} Risk</span>
                        <span className="text-base font-bold font-mono text-slate-900 dark:text-white">{value}</span>
                      </div>
                      <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${value >= 85 ? 'bg-[#20C997]' : value >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No live risk report is available for this project yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Verification Status</h3>
              <div className="space-y-2.5">
                <DocumentRow name="AI Governance" verified={Boolean(room?.aiGovernanceVerified || startup?.aiGovernanceVerified)} updated={room?.updatedLabel ?? '—'} />
                <DocumentRow name="Compliance" verified={Boolean(room?.complianceVerified || startup?.complianceVerified)} updated={room?.updatedLabel ?? '—'} />
                <DocumentRow name="Structured Sections" verified={sections.length > 0} updated={`${sections.length} sections`} />
                <DocumentRow name="Live Deal-Flow Link" verified={Boolean(startup)} updated={startup ? 'Connected' : 'Unavailable'} />
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Available Sections</h3>
              {sections.length === 0 ? (
                <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-8 text-center">
                  <Database className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-600" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">No live data-room sections have been persisted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {sections.map((section) => {
                    const Icon = sectionIcon(section);
                    return (
                      <div key={section} className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 p-4">
                        <Icon className="h-5 w-5 text-[#20C997]" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{section}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface TabButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}

function TabButton({ icon: Icon, label, active }: TabButtonProps) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-left ${
        active
          ? 'bg-[#20C997]/15 text-[#20C997] border border-[#20C997]/30 font-semibold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-medium truncate">{label}</span>
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      <p className="text-xl font-bold font-mono text-slate-900 dark:text-white break-all">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl text-center">
      <p className={`text-2xl font-bold font-mono ${color} mb-0.5`}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
    </div>
  );
}

function DocumentRow({ name, verified, updated }: { name: string; verified: boolean; updated: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-slate-400" />
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{name}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{updated}</p>
        </div>
      </div>
      <div>
        {verified ? (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-[#20C997]/15 rounded-full border border-[#20C997]/20">
            <Shield className="w-3 h-3 text-[#20C997]" />
            <span className="text-[10px] font-semibold text-[#20C997]">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-white/10 rounded-full">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Pending</span>
          </div>
        )}
      </div>
    </div>
  );
}
