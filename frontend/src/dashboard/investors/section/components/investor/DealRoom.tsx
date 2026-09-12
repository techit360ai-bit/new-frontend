import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, FileText, Users, DollarSign, Calendar, PenTool, CheckCircle } from 'lucide-react';
import { fetchDealRoom, type DealRoomDetail } from '@/lib/api/dealRooms';
import { fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';

function fmtUSD(n: number) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function riskColor(riskLevel?: string) {
  if (riskLevel === 'low') return 'text-emerald-400';
  if (riskLevel === 'moderate') return 'text-amber-400';
  if (riskLevel === 'high') return 'text-red-400';
  return 'text-gray-400';
}

export function DealRoom() {
  const { startupId } = useParams();
  const [startup, setStartup] = useState<InvestorStartup | null>(null);
  const [detail, setDetail] = useState<DealRoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!startupId) {
      setIsLoading(false);
      return;
    }
    let alive = true;
    Promise.all([fetchDealFlow(), fetchDealRoom(startupId)])
      .then(([dealFlow, dealRoom]) => {
        if (!alive) return;
        setStartup(dealFlow.ranking.find((item) => item.id === startupId) ?? null);
        setDetail(dealRoom);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live deal room.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, [startupId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-gray-400">
        Loading live deal room...
      </div>
    );
  }

  if (!startup && !detail) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Live deal room not found</h2>
          <p className="text-sm text-gray-400 mb-4">
            This project does not have a persisted deal-room record for the current investor account.
          </p>
          <Link to="/investor/deal-intelligence" className="text-emerald-400 hover:text-emerald-300">
            Return to Deal Intelligence
          </Link>
        </div>
      </div>
    );
  }

  const projectId = startupId ?? detail?.projectId ?? startup?.id ?? '';
  const name = startup?.name ?? projectId;
  const ts = detail?.termSheet;
  const valuation = Number(detail?.valuationUSD || ts?.valuationUSD || 0);
  const investmentStr = ts ? fmtUSD(ts.investmentUSD) : '—';
  const equityStr = ts ? `${ts.equityPercent}%` : '—';
  const instrument = ts?.instrument || '—';
  const discountStr = ts ? `${ts.discountPercent}%` : '—';
  const capStr = ts ? fmtUSD(ts.valuationCapUSD) : '—';
  const boardSeat = ts?.extraTerms?.rights ?? '—';
  const milestones = detail?.milestones ?? [];
  const documents = detail?.documents ?? [];
  const negotiation = detail?.negotiation ?? [];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 bg-[#111111] px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{name} - Deal Room</h1>
            <p className="text-gray-400 mt-1">Secure negotiation and structuring environment</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Encrypted
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Cap Table Preview
                </h3>
              </div>
              <EmptyPanel message="No live cap-table preview is persisted for this deal room yet." />
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Term Sheet
              </h3>
              {ts ? (
                <div className="space-y-4">
                  <ReadOnlyField label="Investment Amount" value={investmentStr} />
                  <ReadOnlyField label="Valuation" value={fmtUSD(valuation)} />
                  <ReadOnlyField label="Equity %" value={equityStr} />
                  <ReadOnlyField label="Instrument Type" value={instrument} />

                  <div className="pt-4 border-t border-gray-800">
                    <h4 className="text-sm font-semibold text-white mb-3">Key Terms</h4>
                    <div className="space-y-2 text-sm">
                      <TermRow label="Valuation Cap" value={capStr} />
                      <TermRow label="Discount Rate" value={discountStr} />
                      <TermRow label="Pro Rata Rights" value={ts.extraTerms?.proRata ?? '—'} />
                      <TermRow label="Board Seat" value={boardSeat} />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyPanel message="No live term sheet has been persisted for this project yet." />
              )}
            </div>

            <div className="bg-gradient-to-br from-[#20C997]/10 to-emerald-500/10 border border-[#20C997]/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Milestone-Based Capital Release
              </h3>
              {milestones.length === 0 ? (
                <p className="text-sm text-gray-400">No live milestone release clauses are persisted yet.</p>
              ) : (
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <MilestoneClause
                      key={`${m.milestone}-${i}`}
                      milestone={m.milestone}
                      amount={fmtUSD(Number(m.amount))}
                      condition={m.condition}
                      status={m.status === 'completed' ? 'completed' : 'pending'}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#20C997]" />
                Document Signing
              </h3>
              {documents.length === 0 ? (
                <EmptyPanel message="No live deal documents are persisted for signature yet." />
              ) : (
                <div className="space-y-2">
                  {documents.map((d, i) => (
                    <DocumentItem key={`${d.name}-${i}`} name={d.name} status={d.status === 'draft' ? 'draft' : 'ready'} />
                  ))}
                </div>
              )}
                <button
                disabled={documents.length === 0}
                className="app-touch-target mt-4 w-full rounded-lg bg-emerald-500 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500"
              >
                Review & Sign Documents
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Deal Overview</h3>
              <div className="space-y-4">
                <SummaryItem icon={DollarSign} label="Suggested Investment" value={investmentStr} color="text-emerald-400" />
                <SummaryItem icon={Users} label="Equity" value={equityStr} color="text-purple-400" />
                <SummaryItem icon={FileText} label="Valuation" value={fmtUSD(valuation)} color="text-[#20C997]" />
              </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Current Performance</h3>
              {startup ? (
                <div className="space-y-3 text-sm">
                  <MetricLine label="Market Readiness" value={startup.readinessScore} />
                  <MetricLine label="MRR" value={fmtUSD(startup.mrr)} color="text-emerald-400" />
                  <MetricLine label="Growth Rate" value={`+${startup.revenueGrowth}%`} color="text-emerald-400" />
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level</span>
                    <span className={`capitalize ${riskColor(startup.riskLevel)}`}>{startup.riskLevel}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No live performance snapshot is attached to this deal room yet.</p>
              )}
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Negotiation Status</h3>
              {negotiation.length === 0 ? (
                <p className="text-sm text-gray-400">No live negotiation steps are persisted yet.</p>
              ) : (
                <div className="space-y-3">
                  {negotiation.map((n, i) => (
                    <StatusStep key={`${n.step}-${i}`} step={n.step} completed={n.state === 'completed'} active={n.state === 'active'} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link to={`/investor/data-room/${projectId}`} className="app-touch-target flex w-full items-center justify-center rounded bg-[#20C997]/10 py-2 text-center text-sm font-medium text-[#20C997] transition-all hover:bg-[#20C997]/20">
                  View Data Room
                </Link>
                <Link to={`/investor/risk-radar/${projectId}`} className="app-touch-target flex w-full items-center justify-center rounded bg-purple-500/10 py-2 text-center text-sm font-medium text-purple-400 transition-all hover:bg-purple-500/20">
                  Risk Analysis
                </Link>
                <button className="app-touch-target w-full rounded bg-gray-800 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-gray-700">
                  Schedule Call
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-800/30 p-6 text-center text-sm text-gray-400">
      {message}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-sm text-gray-400 mb-2 block">{label}</label>
      <div className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">{value}</div>
    </div>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function MilestoneClause({ milestone, amount, condition, status }: { milestone: string; amount: string; condition: string; status: 'completed' | 'pending' }) {
  return (
    <div className={`p-4 rounded-lg border ${status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-gray-800/50 border-gray-700'}`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-white">{milestone}</h4>
          <p className="text-sm text-gray-400 mt-1">{condition}</p>
        </div>
        <span className="font-mono font-bold text-emerald-400">{amount}</span>
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
        {status === 'completed' && <CheckCircle className="w-3 h-3" />}
        {status}
      </div>
    </div>
  );
}

function DocumentItem({ name, status }: { name: string; status: 'ready' | 'draft' }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-[#20C997]" />
        <span className="text-sm text-white">{name}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded ${status === 'ready' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
        {status}
      </span>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="font-mono font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

function MetricLine({ label, value, color = 'text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className={`font-mono ${color}`}>{value}</span>
    </div>
  );
}

function StatusStep({ step, completed, active }: { step: string; completed: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center ${
          completed ? 'bg-emerald-500' : active ? 'bg-[#20C997]' : 'bg-gray-700'
        }`}
      >
        {completed && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
      <span className={`text-sm ${completed || active ? 'text-white' : 'text-gray-500'}`}>{step}</span>
    </div>
  );
}
