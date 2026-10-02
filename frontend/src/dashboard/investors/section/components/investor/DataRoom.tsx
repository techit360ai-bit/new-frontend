import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileText, Download, Lock, Shield, BarChart3, DollarSign, Zap, Database } from 'lucide-react';
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
      <div className="min-h-screen bg-background-inverse flex items-center justify-center text-text-on-inverse-muted">
        Loading live data room...
      </div>
    );
  }

  if (!startup && !room) {
    return (
      <div className="min-h-screen bg-background-inverse flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Live data room not found</h2>
          <p className="text-sm text-text-on-inverse-muted mb-4">
            This project does not have a persisted investor data-room record for the current account.
          </p>
          <Link to="/investor/deal-intelligence" className="text-status-success hover:text-status-success">
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
    <div className="min-h-screen bg-background-inverse">
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">{name} - Data Room</h1>
            <p className="text-text-on-inverse-muted mt-1">Structured live diligence repository</p>
          </div>
          <div className="flex gap-3">
            <button
              disabled={!room}
              className="px-4 py-2 bg-status-success hover:bg-status-success disabled:bg-surface-inverse-muted disabled:text-text-on-inverse-disabled text-white font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All
            </button>
            <Link
              to={`/investor/deal-room/${projectId}`}
              className="px-4 py-2 bg-status-pending/10 hover:bg-status-pending/20 text-status-pending font-medium rounded-lg transition-all flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Deal Room
            </Link>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-4">
            <h3 className="text-sm font-semibold text-text-on-inverse-muted mb-3">SECTIONS</h3>
            {sections.length === 0 ? (
              <p className="text-sm text-text-on-inverse-disabled">No live sections are available yet.</p>
            ) : (
              <nav className="space-y-1">
                {sections.map((section, index) => (
                  <TabButton key={section} icon={sectionIcon(section)} label={section} active={index === 0} />
                ))}
              </nav>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Live Metrics Snapshot</h3>
              {startup ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <MetricCard label="Market Readiness Score" value={startup.readinessScore.toString()} />
                    <MetricCard label="Execution Velocity Index" value={startup.executionVelocity.toString()} />
                    <MetricCard label="Beta Retention Rate" value={`${startup.betaRetention}%`} />
                    <MetricCard label="Revenue Growth (MoM)" value={`${startup.revenueGrowth}%`} />
                    <MetricCard label="Monthly Recurring Revenue" value={formatMoney(startup.mrr)} />
                    <MetricCard label="Burn Efficiency Ratio" value={startup.burnEfficiency.toFixed(1)} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <StatCard label="Pivot Frequency" value={startup.pivotFrequency} color="text-status-warning" />
                    <StatCard label="Experiment Velocity" value={`${startup.experimentVelocity}/wk`} color="text-status-pending" />
                    <StatCard label="Founder Reliability" value={startup.founderReliability} color="text-status-success" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-text-on-inverse-muted">No live deal-flow metrics are attached to this data room yet.</p>
              )}
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Data Room Metadata</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Project" value={projectId || '—'} />
                <MetricCard label="Sector" value={sector} />
                <MetricCard label="Documents" value={String(room?.docCount ?? 0)} />
                <MetricCard label="Updated" value={room?.updatedLabel ?? '—'} />
              </div>
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Risk Analysis Report</h3>
              {startup ? (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(startup.riskMetrics).map(([key, value]) => (
                    <div key={key} className="p-4 bg-surface-inverse-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-text-on-inverse-muted capitalize">{key} Risk</span>
                        <span className="text-lg font-bold font-mono text-white">{value}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${value >= 85 ? 'bg-status-success' : value >= 70 ? 'bg-status-warning' : 'bg-status-error'}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-on-inverse-muted">No live risk report is available for this project yet.</p>
              )}
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Verification Status</h3>
              <div className="space-y-2">
                <DocumentRow name="AI Governance" verified={Boolean(room?.aiGovernanceVerified || startup?.aiGovernanceVerified)} updated={room?.updatedLabel ?? '—'} />
                <DocumentRow name="Compliance" verified={Boolean(room?.complianceVerified || startup?.complianceVerified)} updated={room?.updatedLabel ?? '—'} />
                <DocumentRow name="Structured Sections" verified={sections.length > 0} updated={`${sections.length} sections`} />
                <DocumentRow name="Live Deal-Flow Link" verified={Boolean(startup)} updated={startup ? 'Connected' : 'Unavailable'} />
              </div>
            </div>

            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Available Sections</h3>
              {sections.length === 0 ? (
                <div className="rounded-lg border border-border-inverse bg-surface-inverse-muted/30 p-8 text-center">
                  <Database className="mx-auto mb-3 h-8 w-8 text-text-on-inverse-disabled" />
                  <p className="text-sm text-text-on-inverse-muted">No live data-room sections have been persisted yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {sections.map((section) => {
                    const Icon = sectionIcon(section);
                    return (
                      <div key={section} className="flex items-center gap-3 rounded-lg bg-surface-inverse-muted/50 p-4">
                        <Icon className="h-5 w-5 text-status-info" />
                        <span className="text-sm font-medium text-white">{section}</span>
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
        active
          ? 'bg-status-success/10 text-status-success border border-status-success/20'
          : 'text-text-on-inverse-muted hover:text-text-on-inverse-secondary hover:bg-surface-inverse-muted/50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-surface-inverse-muted/50 rounded-lg">
      <p className="text-sm text-text-on-inverse-muted mb-2">{label}</p>
      <p className="text-2xl font-bold font-mono text-white break-all">{value}</p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="p-4 bg-surface-inverse-muted/50 rounded-lg text-center">
      <p className={`text-3xl font-bold font-mono ${color} mb-1`}>{value}</p>
      <p className="text-sm text-text-on-inverse-muted">{label}</p>
    </div>
  );
}

function DocumentRow({ name, verified, updated }: { name: string; verified: boolean; updated: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-surface-inverse-muted/50 rounded-lg hover:bg-surface-inverse-muted transition-colors group">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-text-on-inverse-muted" />
        <div>
          <p className="font-medium text-white">{name}</p>
          <p className="text-sm text-text-on-inverse-muted">{updated}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {verified ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-status-success/20 rounded">
            <Shield className="w-3 h-3 text-status-success" />
            <span className="text-xs text-status-success">Verified</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
            <Lock className="w-3 h-3 text-text-on-inverse-muted" />
            <span className="text-xs text-text-on-inverse-muted">Pending</span>
          </div>
        )}
      </div>
    </div>
  );
}
