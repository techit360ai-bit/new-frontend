import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDealFlow, fetchWatchlistPreferences, removeFromWatchlist, updateWatchlistPreferences, type InvestorStartup, type WatchlistPreferences } from '@/lib/api/dealFlow';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Bell,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Briefcase,
  BarChart2,
  ArrowRight,
  Sparkles,
  X,
} from 'lucide-react';

export function Watchlist() {
  const [watchedStartups, setWatchedStartups] = useState<InvestorStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertStates, setAlertStates] = useState<WatchlistPreferences>({
    velocity: true,
    risk: true,
    milestone: false,
    trust: false,
    dealStatus: false,
  });

  useEffect(() => {
    let alive = true;
    Promise.all([fetchDealFlow(), fetchWatchlistPreferences()])
      .then(([data, preferences]) => {
        if (!alive) return;
        setWatchedStartups(data.ranking.filter((startup) => startup.watchlisted));
        setAlertStates(preferences.preferences);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live watchlist.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleAlert = (key: keyof WatchlistPreferences) => {
    setAlertStates((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      void updateWatchlistPreferences({ [key]: next[key] }).catch(() => setError('Unable to save alert preference.'));
      return next;
    });
  };

  const remove = async (projectId: string) => {
    try {
      await removeFromWatchlist(projectId);
      setWatchedStartups((items) => items.filter((item) => item.id !== projectId));
    } catch {
      setError('Unable to remove this startup from the watchlist.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Watchlist & Signals
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Eye className="w-3 h-3" /> Live Monitor
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Track execution velocity, risk shifts, and get real-time startup performance alerts
            </p>
          </div>
          <button
            onClick={() => setShowAlertModal(!showAlertModal)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 px-4 py-2.5 font-semibold text-[#20C997] border border-[#20C997]/20 transition-all hover:bg-[#20C997]/20"
          >
            <Bell className="w-4 h-4" />
            Manage Alert Preferences
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Alert preferences panel */}
        {showAlertModal && (
          <div className="bg-white dark:bg-[#111111] border border-[#20C997]/30 rounded-2xl p-6 shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#20C997]" /> Signal & Alert Thresholds
              </h3>
              <button
                onClick={() => setShowAlertModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AlertCard
                title="Execution Velocity Shifts"
                description="Alert when a watched startup changes speed by >15% over 7 days."
                enabled={alertStates.velocity}
                onToggle={() => toggleAlert('velocity')}
              />
              <AlertCard
                title="Risk Level Anomalies"
                description="Alert when compliance or burn metrics trigger high-risk status."
                enabled={alertStates.risk}
                onToggle={() => toggleAlert('risk')}
              />
              <AlertCard
                title="Milestone Completion"
                description="Alert when key roadmap goals or hackathon demos are verified."
                enabled={alertStates.milestone}
                onToggle={() => toggleAlert('milestone')}
              />
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="hidden grid-cols-12 gap-4 border-b border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 md:grid">
            <div className="col-span-3">Startup</div>
            <div className="col-span-1 text-center">Readiness</div>
            <div className="col-span-1 text-center">7d Δ</div>
            <div className="col-span-1 text-center">Risk</div>
            <div className="col-span-1 text-center">Risk Δ</div>
            <div className="col-span-2 text-center">Revenue</div>
            <div className="col-span-1 text-center">Rev Δ</div>
            <div className="col-span-1 text-center">Peers</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-black/[0.06] dark:divide-white/10">
            {isLoading && (
              <div className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                Loading live watchlist...
              </div>
            )}

            {!isLoading && watchedStartups.length === 0 && (
              <div className="px-6 py-12 text-center">
                <Eye className="mx-auto mb-3 h-8 w-8 text-slate-400 dark:text-slate-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No live watchlist records</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  Click 'Watch' on any startup in the Deal Intelligence dashboard to add it to your watchlist.
                </p>
              </div>
            )}

            {watchedStartups.map((startup) => {
              const readinessDelta = startup.readinessDelta || startup.velocityDelta;
              const riskDelta = startup.riskDelta;
              const isExpanded = expandedId === startup.id;

              return (
                <div key={startup.id}>
                  {/* Main row */}
                  <div
                    className={`grid cursor-pointer grid-cols-2 gap-4 px-4 py-5 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03] sm:px-6 md:grid-cols-12 md:py-4 ${
                      isExpanded ? 'bg-slate-50 dark:bg-white/[0.04]' : ''
                    }`}
                    onClick={() => toggleExpanded(startup.id)}
                  >
                    <div className="col-span-2 flex items-center gap-3 md:col-span-3">
                      <span className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <Link
                          to={`/investor/risk-radar/${startup.id}`}
                          className="font-bold text-slate-900 dark:text-white hover:text-[#20C997] dark:hover:text-[#20C997] transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {startup.name}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {startup.sector} · {startup.region}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Readiness</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{startup.readinessScore}</p>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">7d change</span>
                      <div
                        className={`inline-flex items-center gap-1 text-sm font-semibold ${
                          readinessDelta > 0
                            ? 'text-[#20C997]'
                            : readinessDelta < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {readinessDelta > 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : readinessDelta < 0 ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : null}
                        {readinessDelta > 0 ? '+' : ''}
                        {readinessDelta}
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Risk</span>
                      <span
                        className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                          startup.riskLevel === 'low'
                            ? 'bg-[#20C997]/10 text-[#20C997]'
                            : startup.riskLevel === 'moderate'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : startup.riskLevel === 'high'
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {startup.riskLevel}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Risk change</span>
                      <span
                        className={`text-sm font-medium ${
                          riskDelta === 'improved' ? 'text-[#20C997]' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {riskDelta}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:col-span-2 md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Revenue</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">
                        ${(startup.mrr / 1000).toFixed(0)}K MRR
                      </p>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Revenue change</span>
                      <div className="inline-flex items-center gap-1 text-sm font-semibold text-[#20C997]">
                        <TrendingUp className="w-4 h-4" />
                        +{startup.revenueDelta}%
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400 md:hidden">Watching</span>
                      <p className="font-mono font-bold text-[#20C997]">{startup.investorsWatching}</p>
                    </div>

                    <div className="col-span-1 flex items-end justify-end gap-2 md:items-center">
                      <button
                        className="p-2 rounded-xl text-slate-400 hover:text-[#20C997] hover:bg-[#20C997]/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); setShowAlertModal(true); }}
                        aria-label={`Manage alerts for ${startup.name}`}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        onClick={(e) => { e.stopPropagation(); void remove(startup.id); }}
                        aria-label={`Remove ${startup.name} from watchlist`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* About section - expanded */}
                  {isExpanded && (
                    <div className="border-t border-black/[0.06] dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-4 pb-6 pt-4 sm:px-6">
                      <div className="md:ml-6 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold tracking-widest text-[#20C997] uppercase">
                            Project Overview
                          </span>
                          <div className="flex-1 h-px bg-[#20C997]/20"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* What's being built */}
                          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-[#20C997]/15 rounded-lg">
                                <Briefcase className="w-4 h-4 text-[#20C997]" />
                              </div>
                              <span className="text-xs font-semibold text-[#20C997] uppercase tracking-wider">
                                What's Being Built
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {startup.about.summary || 'No live project overview is available yet.'}
                            </p>
                          </div>

                          {/* Use Case */}
                          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-purple-500/15 rounded-lg">
                                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              </div>
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                Primary Use Case
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {startup.about.useCase || 'No live use-case summary is available yet.'}
                            </p>
                          </div>

                          {/* Market Size */}
                          <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-4 shadow-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 bg-[#20C997]/15 rounded-lg">
                                <BarChart2 className="w-4 h-4 text-[#20C997]" />
                              </div>
                              <span className="text-xs font-semibold text-[#20C997] uppercase tracking-wider">
                                Market Opportunity
                              </span>
                            </div>
                            <div className="mb-1">
                              <span className="text-xl font-bold font-mono text-[#20C997]">
                                {startup.about.marketSizeValue || '—'}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">TAM</span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                              {startup.about.marketSize || 'No live market-size note is available yet.'}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="grid gap-3 sm:grid-cols-3">
                          <Link
                            to={`/investor/risk-radar/${startup.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997]/10 px-4 py-2.5 text-xs font-semibold text-[#20C997] transition-all hover:bg-[#20C997]/20"
                          >
                            Full Risk Analysis
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/investor/data-room/${startup.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-all hover:bg-slate-300 dark:hover:bg-white/10"
                          >
                            Data Room
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            to={`/investor/deal-room/${startup.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-500/10 px-4 py-2.5 text-xs font-semibold text-purple-600 dark:text-purple-400 transition-all hover:bg-purple-500/20"
                          >
                            Deal Room
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Founder Notification Loop */}
        <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#20C997]/20 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-[#20C997]" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-[#20C997] uppercase tracking-wider mb-1">Watchlist Signaling Active</h4>
              <p className="text-slate-900 dark:text-white font-medium text-sm">
                Founders see: &ldquo;{watchedStartups.length} verified investors are tracking your real-time metrics.&rdquo;
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">
                This creates active founder momentum, encouraging faster execution and transparent updates across your portfolio pipeline.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AlertCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function AlertCard({ title, description, enabled, onToggle }: AlertCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/10 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{title}</h4>
          <span className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-[#20C997]' : 'bg-slate-300 dark:bg-white/20'}`} />
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
          enabled
            ? 'bg-[#20C997]/15 text-[#20C997] hover:bg-[#20C997]/25'
            : 'bg-slate-200 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-white/10'
        }`}
      >
        {enabled ? 'Active — Click to Disable' : 'Inactive — Click to Enable'}
      </button>
    </div>
  );
}
