import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, FileText, Users, DollarSign, Calendar, PenTool, CheckCircle, Sparkles } from 'lucide-react';
import { fetchDealRoom, type DealRoomDetail } from '@/lib/api/dealRooms';
import { fetchDealFlow, type InvestorStartup } from '@/lib/api/dealFlow';

function fmtUSD(n: number) {
  if (!n) return '—';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function riskColor(riskLevel?: string) {
  if (riskLevel === 'low') return 'text-[#20C997]';
  if (riskLevel === 'moderate') return 'text-amber-600 dark:text-amber-400';
  if (riskLevel === 'high') return 'text-red-600 dark:text-red-400';
  return 'text-slate-500 dark:text-slate-400';
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center text-slate-500 dark:text-slate-400">
        Loading live deal room...
      </div>
    );
  }

  if (!startup && !detail) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center bg-white dark:bg-[#111111] p-8 rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-sm max-w-md">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Live deal room not found</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            This project does not have a persisted deal-room record for the current investor account.
          </p>
          <Link to="/investor/deal-intelligence" className="inline-flex items-center justify-center px-4 py-2.5 bg-[#20C997] text-slate-950 font-bold rounded-xl text-xs">
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {name} — Deal Room
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Secure Vault
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Encrypted term sheet negotiation and milestone structure
            </p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-[#20C997]/10 border border-[#20C997]/20 rounded-xl self-start sm:self-auto">
            <Shield className="w-4 h-4 text-[#20C997]" />
            <span className="text-xs font-bold text-[#20C997]">AES-256 Encrypted</span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Cap Table Preview
                </h3>
              </div>
              <EmptyPanel message="No live cap-table preview is persisted for this deal room yet." />
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#20C997]" />
                Term Sheet
              </h3>
              {ts ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ReadOnlyField label="Investment Amount" value={investmentStr} />
                    <ReadOnlyField label="Valuation" value={fmtUSD(valuation)} />
                    <ReadOnlyField label="Equity %" value={equityStr} />
                    <ReadOnlyField label="Instrument Type" value={instrument} />
                  </div>

                  <div className="pt-4 border-t border-black/[0.04] dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Key Terms</h4>
                    <div className="space-y-2 text-xs">
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

            <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#20C997]" />
                Milestone-Based Capital Release
              </h3>
              {milestones.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-400">No live milestone release clauses are persisted yet.</p>
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

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#20C997]" />
                Document Signing
              </h3>
              {documents.length === 0 ? (
                <EmptyPanel message="No live deal documents are persisted for signature yet." />
              ) : (
                <div className="space-y-2.5 mb-4">
                  {documents.map((d, i) => (
                    <DocumentItem key={`${d.name}-${i}`} name={d.name} status={d.status === 'draft' ? 'draft' : 'ready'} />
                  ))}
                </div>
              )}
              <button
                disabled={documents.length === 0}
                className="w-full rounded-xl bg-[#20C997] hover:bg-[#1cb084] py-3 text-xs font-bold text-slate-950 transition-all disabled:opacity-50 shadow-sm"
              >
                Review & Sign Documents
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Deal Overview</h3>
              <div className="space-y-3">
                <SummaryItem icon={DollarSign} label="Suggested Investment" value={investmentStr} color="text-[#20C997]" />
                <SummaryItem icon={Users} label="Equity" value={equityStr} color="text-purple-600 dark:text-purple-400" />
                <SummaryItem icon={FileText} label="Valuation" value={fmtUSD(valuation)} color="text-[#20C997]" />
              </div>
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Current Performance</h3>
              {startup ? (
                <div className="space-y-3 text-xs">
                  <MetricLine label="Market Readiness" value={startup.readinessScore} />
                  <MetricLine label="MRR" value={fmtUSD(startup.mrr)} color="text-[#20C997]" />
                  <MetricLine label="Growth Rate" value={`+${startup.revenueGrowth}%`} color="text-[#20C997]" />
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Risk Level</span>
                    <span className={`capitalize font-bold ${riskColor(startup.riskLevel)}`}>{startup.riskLevel}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No live performance snapshot is attached to this deal room yet.</p>
              )}
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Negotiation Status</h3>
              {negotiation.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">No live negotiation steps are persisted yet.</p>
              ) : (
                <div className="space-y-3">
                  {negotiation.map((n, i) => (
                    <StatusStep key={`${n.step}-${i}`} step={n.step} completed={n.state === 'completed'} active={n.state === 'active'} />
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-2.5">
                <Link to={`/investor/data-room/${projectId}`} className="flex w-full items-center justify-center rounded-xl bg-[#20C997]/10 py-2.5 text-center text-xs font-semibold text-[#20C997] transition-all hover:bg-[#20C997]/20">
                  View Data Room
                </Link>
                <Link to={`/investor/risk-radar/${projectId}`} className="flex w-full items-center justify-center rounded-xl bg-purple-500/10 py-2.5 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20">
                  Risk Analysis
                </Link>
                <button className="w-full rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/10 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all">
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
    <div className="rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] p-6 text-center text-xs text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">{label}</label>
      <div className="w-full px-4 py-2.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-mono font-bold text-sm">{value}</div>
    </div>
  );
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-900 dark:text-white font-mono font-bold">{value}</span>
    </div>
  );
}

function MilestoneClause({ milestone, amount, condition, status }: { milestone: string; amount: string; condition: string; status: 'completed' | 'pending' }) {
  return (
    <div className={`p-4 rounded-xl border ${status === 'completed' ? 'bg-[#20C997]/10 border-[#20C997]/20' : 'bg-white dark:bg-white/[0.03] border-black/[0.04] dark:border-white/5'}`}>
      <div className="flex justify-between items-start mb-1.5">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{milestone}</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{condition}</p>
        </div>
        <span className="font-mono font-bold text-[#20C997] text-sm">{amount}</span>
      </div>
      <div className={`mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status === 'completed' ? 'bg-[#20C997]/20 text-[#20C997]' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
        {status === 'completed' && <CheckCircle className="w-3 h-3 text-[#20C997]" />}
        {status}
      </div>
    </div>
  );
}

function DocumentItem({ name, status }: { name: string; status: 'ready' | 'draft' }) {
  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-[#20C997]" />
        <span className="text-xs font-bold text-slate-900 dark:text-white">{name}</span>
      </div>
      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${status === 'ready' ? 'bg-[#20C997]/15 text-[#20C997]' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
        {status}
      </span>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">{value}</p>
      </div>
    </div>
  );
}

function MetricLine({ label, value, color = 'text-slate-900 dark:text-white' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}

function StatusStep({ step, completed, active }: { step: string; completed: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
          completed ? 'bg-[#20C997]' : active ? 'bg-[#20C997]/50' : 'bg-slate-200 dark:bg-white/10'
        }`}
      >
        {completed && <CheckCircle className="w-3.5 h-3.5 text-slate-950" />}
      </div>
      <span className={`font-medium ${completed || active ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-400 dark:text-slate-500'}`}>{step}</span>
    </div>
  );
}
