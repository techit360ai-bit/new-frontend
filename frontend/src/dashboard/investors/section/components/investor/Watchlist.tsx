import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchDealFlow, fetchWatchlistPreferences, removeFromWatchlist, updateWatchlistPreferences, type InvestorStartup, type WatchlistPreferences } from '@/lib/api/dealFlow';
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Trash2,
  ChevronDown,
  ChevronRight,
  Target,
  Briefcase,
  BarChart2,
  ArrowRight,
} from 'lucide-react';

export function Watchlist() {
  const [watchedStartups, setWatchedStartups] = useState<InvestorStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
    <div className="min-h-screen bg-background-inverse">
      {/* Header */}
      <div className="border-b border-border-inverse bg-surface-inverse px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Watchlist & Signals</h1>
            <p className="text-text-on-inverse-muted mt-1">Track execution velocity and get real-time alerts</p>
          </div>
          <button className="app-touch-target inline-flex w-full items-center justify-center gap-2 rounded-lg bg-status-info/10 px-4 py-2 font-medium text-status-info transition-all hover:bg-status-info/20 sm:w-auto">
            <Bell className="w-4 h-4" />
            Manage Alerts
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        <div className="bg-surface-inverse border border-border-inverse rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="hidden grid-cols-12 gap-4 border-b border-border-inverse bg-surface-inverse-muted/50 px-6 py-4 text-sm font-medium text-text-on-inverse-muted md:grid">
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
          <div className="divide-y divide-gray-800">
            {isLoading && (
              <div className="px-6 py-10 text-center text-sm text-text-on-inverse-muted">
                Loading live watchlist...
              </div>
            )}

            {!isLoading && watchedStartups.length === 0 && (
              <div className="px-6 py-10 text-center">
                <Eye className="mx-auto mb-3 h-8 w-8 text-text-on-inverse-disabled" />
                <h3 className="text-lg font-semibold text-white mb-1">No live watchlist records</h3>
                <p className="text-sm text-text-on-inverse-muted">
                  Startups will appear after persisted investor watchlist records are created.
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
                    className={`grid cursor-pointer grid-cols-2 gap-4 px-4 py-5 transition-colors hover:bg-surface-inverse-muted/30 sm:px-6 md:grid-cols-12 md:py-4 ${
                      isExpanded ? 'bg-surface-inverse-muted/20' : ''
                    }`}
                    onClick={() => toggleExpanded(startup.id)}
                  >
                    <div className="col-span-2 flex items-center gap-2 md:col-span-3">
                      <span className="text-text-on-inverse-disabled hover:text-text-on-inverse-secondary transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>
                      <div>
                        <Link
                          to={`/investor/risk-radar/${startup.id}`}
                          className="font-semibold text-white hover:text-status-success transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {startup.name}
                        </Link>
                        <p className="text-sm text-text-on-inverse-muted mt-0.5">
                          {startup.sector} · {startup.region}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Readiness</span>
                      <p className="font-mono font-semibold text-white">{startup.readinessScore}</p>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">7d change</span>
                      <div
                        className={`inline-flex items-center gap-1 text-sm font-medium ${
                          readinessDelta > 0
                            ? 'text-status-success'
                            : readinessDelta < 0
                            ? 'text-status-error'
                            : 'text-text-on-inverse-muted'
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
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Risk</span>
                      <span
                        className={`text-sm font-medium capitalize ${
                          startup.riskLevel === 'low'
                            ? 'text-status-success'
                            : startup.riskLevel === 'moderate'
                            ? 'text-status-warning'
                            : startup.riskLevel === 'high'
                            ? 'text-status-error'
                            : 'text-text-on-inverse-muted'
                        }`}
                      >
                        {startup.riskLevel}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Risk change</span>
                      <span
                        className={`text-sm font-medium ${
                          riskDelta === 'improved' ? 'text-status-success' : 'text-text-on-inverse-muted'
                        }`}
                      >
                        {riskDelta}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:col-span-2 md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Revenue</span>
                      <p className="font-mono font-semibold text-white">
                        ${(startup.mrr / 1000).toFixed(0)}K MRR
                      </p>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Revenue change</span>
                      <div className="inline-flex items-center gap-1 text-sm font-medium text-status-success">
                        <TrendingUp className="w-4 h-4" />
                        +{startup.revenueDelta}%
                      </div>
                    </div>

                    <div className="col-span-1 flex flex-col items-start justify-center md:items-center md:text-center">
                      <span className="mb-1 text-[10px] font-medium uppercase tracking-wide text-text-on-inverse-disabled md:hidden">Watching</span>
                      <p className="font-mono text-status-info">{startup.investorsWatching}</p>
                    </div>

                    <div className="col-span-1 flex items-end justify-end gap-2 md:items-center">
                      <button
                        className="app-touch-target inline-flex items-center justify-center rounded text-status-info transition-colors hover:bg-status-info/10"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Manage alerts for ${startup.name}`}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        className="app-touch-target inline-flex items-center justify-center rounded text-status-error transition-colors hover:bg-status-error/10"
                        onClick={(e) => { e.stopPropagation(); void remove(startup.id); }}
                        aria-label={`Remove ${startup.name} from watchlist`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* About section - expanded */}
                  {isExpanded && (
                    <div className="border-t border-border-inverse/60 bg-background-inverse-secondary px-4 pb-6 pt-4 sm:px-6 md:pt-2">
                      <div className="md:ml-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs font-mono font-semibold tracking-widest text-status-success uppercase">
                            Project Overview
                          </span>
                          <div className="flex-1 h-px bg-status-success/20"></div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* What's being built */}
                          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-status-info/15 rounded">
                                <Briefcase className="w-4 h-4 text-status-info" />
                              </div>
                              <span className="text-xs font-semibold text-status-info uppercase tracking-wider">
                                What's Being Built
                              </span>
                            </div>
                            <p className="text-sm text-text-on-inverse-secondary leading-relaxed">
                              {startup.about.summary || 'No live project overview is available yet.'}
                            </p>
                          </div>

                          {/* Use Case */}
                          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-status-pending/15 rounded">
                                <Target className="w-4 h-4 text-status-pending" />
                              </div>
                              <span className="text-xs font-semibold text-status-pending uppercase tracking-wider">
                                Primary Use Case
                              </span>
                            </div>
                            <p className="text-sm text-text-on-inverse-secondary leading-relaxed">
                              {startup.about.useCase || 'No live use-case summary is available yet.'}
                            </p>
                          </div>

                          {/* Market Size */}
                          <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-status-success/15 rounded">
                                <BarChart2 className="w-4 h-4 text-status-success" />
                              </div>
                              <span className="text-xs font-semibold text-status-success uppercase tracking-wider">
                                Market Opportunity
                              </span>
                            </div>
                            <div className="mb-2">
                              <span className="text-2xl font-bold font-mono text-status-success">
                                {startup.about.marketSizeValue || '—'}
                              </span>
                              <span className="text-xs text-text-on-inverse-disabled ml-1">TAM</span>
                            </div>
                            <p className="text-sm text-text-on-inverse-secondary leading-relaxed">
                              {startup.about.marketSize || 'No live market-size note is available yet.'}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <Link
                            to={`/investor/risk-radar/${startup.id}`}
                            className="app-touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-status-success/10 px-4 py-2 text-sm font-medium text-status-success transition-all hover:bg-status-success/20"
                          >
                            Full Risk Analysis
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/investor/data-room/${startup.id}`}
                            className="app-touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-status-info/10 px-4 py-2 text-sm font-medium text-status-info transition-all hover:bg-status-info/20"
                          >
                            Data Room
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/investor/deal-room/${startup.id}`}
                            className="app-touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-status-pending/10 px-4 py-2 text-sm font-medium text-status-pending transition-all hover:bg-status-pending/20"
                          >
                            Deal Room
                            <ArrowRight className="w-4 h-4" />
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

        {/* Alert Settings */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <AlertCard
            title="Velocity Spike Alert"
            description="Get notified when execution velocity increases >20%"
            enabled={alertStates.velocity}
            onToggle={() => toggleAlert('velocity')}
          />
          <AlertCard
            title="Risk Shift Alert"
            description="Alert when risk level changes significantly"
            enabled={alertStates.risk}
            onToggle={() => toggleAlert('risk')}
          />
          <AlertCard
            title="Milestone Alert"
            description="Notification for major milestone completions"
            enabled={alertStates.milestone}
            onToggle={() => toggleAlert('milestone')}
          />
        </div>

        {/* Founder Notification Loop */}
        <div className="mt-6 bg-gradient-to-br from-brand-primary/10 to-status-pending/10 border border-status-info/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-status-info/20 rounded-lg">
              <Eye className="w-5 h-5 text-status-info" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-status-info mb-2">WATCHLIST LOOP ACTIVE</h4>
              <p className="text-white">
                Founders see: &ldquo;{watchedStartups.length} verified investors are watching your project.&rdquo;
              </p>
              <p className="text-text-on-inverse-secondary text-sm mt-2">
                This creates psychological momentum and signals market validation, encouraging faster
                execution.
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
    <div className="bg-surface-inverse border border-border-inverse rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className={`p-1.5 rounded-lg ${enabled ? 'bg-status-success/20' : 'bg-surface-inverse-muted'}`}>
          {enabled ? (
            <Bell className="w-4 h-4 text-status-success" />
          ) : (
            <BellOff className="w-4 h-4 text-text-on-inverse-muted" />
          )}
        </div>
      </div>
      <p className="text-sm text-text-on-inverse-muted mb-4">{description}</p>
      <button
        onClick={onToggle}
        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
          enabled
            ? 'bg-status-success/10 text-status-success hover:bg-status-success/20'
            : 'bg-surface-inverse-muted text-text-on-inverse-muted hover:bg-gray-700'
        }`}
      >
        {enabled ? 'Enabled — Click to Disable' : 'Disabled — Click to Enable'}
      </button>
    </div>
  );
}
