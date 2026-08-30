import { useEffect, useState } from 'react';
import { Award, TrendingUp, Star, Clock, Heart, Zap, Shield } from 'lucide-react';
import { EMPTY_REPUTATION, fetchInvestorReputation } from '@/lib/api/investorReputation';

// Map metric keys to their icon + accent color (presentation stays in the FE).
const METRIC_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  responseSpeed:       { icon: Clock,       color: 'text-status-success' },
  founderRating:       { icon: Star,        color: 'text-status-warning' },
  followThrough:       { icon: Zap,         color: 'text-status-pending' },
  valueAdd:            { icon: Heart,       color: 'text-pink-400' },
  portfolioEngagement: { icon: TrendingUp,  color: 'text-status-info' },
};

export function Reputation() {
  const [rep, setRep] = useState(EMPTY_REPUTATION);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchInvestorReputation()
      .then((data) => {
        if (!alive) return;
        setRep(data);
        setError(null);
      })
      .catch(() => {
        if (alive) setError('Unable to load live investor reputation.');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const investorScore = rep.score;
  const scoreLevel = rep.level;
  const hasReputation =
    investorScore > 0 ||
    rep.metrics.length > 0 ||
    rep.reviews.length > 0 ||
    rep.progression.length > 0 ||
    rep.leaderboard.rank > 0;
  const benefitsUnlocked = investorScore >= 80;

  return (
    <div className="min-h-screen bg-background-inverse">
      {/* Header */}
      <div className="border-b border-border-inverse bg-surface-inverse px-8 py-6">
        <h1 className="text-3xl font-bold text-white">Investor Reputation Dashboard</h1>
        <p className="text-text-on-inverse-muted mt-1">
          Building balanced power dynamics through mutual accountability
        </p>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 rounded-lg border border-border-inverse bg-surface-inverse p-5 text-center text-text-on-inverse-muted">
            Loading live reputation...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Score Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-brand-primary/10 border border-status-success/20 rounded-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Your Reputation Score</h2>
                  <p className="text-text-on-inverse-secondary">Based on founder feedback and engagement metrics</p>
                </div>
                <div className="p-4 bg-status-success/20 rounded-full">
                  <Award className="w-8 h-8 text-status-success" />
                </div>
              </div>
              
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-6xl font-bold font-mono text-status-success">{investorScore}</span>
                <span className="text-2xl text-text-on-inverse-muted">/100</span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-status-success/20 text-status-success rounded-full text-sm font-semibold">
                  {scoreLevel} Tier
                </span>
                <div className="flex items-center gap-1 text-status-success">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {rep.monthChange >= 0 ? `+${rep.monthChange}` : rep.monthChange} this month
                  </span>
                </div>
              </div>
              
              <div className="h-3 bg-surface-inverse-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-brand-primary"
                  style={{ width: `${investorScore}%` }}
                ></div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Reputation Metrics</h3>
              {rep.metrics.length === 0 ? (
                <p className="text-sm text-text-on-inverse-muted">
                  Reputation metrics will appear after founders submit feedback and engagement events are persisted.
                </p>
              ) : (
                <div className="space-y-4">
                  {rep.metrics.map((m) => {
                  const style = METRIC_STYLE[m.key] ?? { icon: Star, color: 'text-status-success' };
                  return (
                    <ScoreMetric
                      key={m.key}
                      icon={style.icon}
                      label={m.label}
                      score={m.score}
                      description={m.description}
                      color={style.color}
                    />
                  );
                  })}
                </div>
              )}
            </div>

            {/* Founder Reviews */}
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Recent Founder Reviews</h3>
              {rep.reviews.length === 0 ? (
                <p className="text-sm text-text-on-inverse-muted">
                  Founder reviews will appear here once live review records are available.
                </p>
              ) : (
                <div className="space-y-4">
                  {rep.reviews.map((r, i) => (
                  <ReviewCard
                    key={`${r.founderName}-${i}`}
                    founderName={r.founderName}
                    startup={r.startup}
                    rating={r.rating}
                    comment={r.comment}
                    date={r.date}
                  />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Benefits & Insights */}
          <div className="space-y-6">
            {/* Benefits Unlocked */}
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-status-success" />
                Elite Tier Benefits
              </h3>
              <div className="space-y-3">
                <BenefitItem 
                  label="Early Access Deals"
                  status={benefitsUnlocked ? 'active' : 'locked'}
                  description="See startups 48h before general investors"
                />
                <BenefitItem 
                  label="Exclusive Cohorts"
                  status={benefitsUnlocked ? 'active' : 'locked'}
                  description="Invitation to private funding rounds"
                />
                <BenefitItem 
                  label="Allocation Priority"
                  status={benefitsUnlocked ? 'active' : 'locked'}
                  description="Preferential allocation in high-demand deals"
                />
                <BenefitItem 
                  label="Direct Founder Intro"
                  status={benefitsUnlocked ? 'active' : 'locked'}
                  description="Skip the queue for top startups"
                />
              </div>
            </div>

            {/* Score History */}
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Score Progression</h3>
              {rep.progression.length === 0 ? (
                <p className="text-sm text-text-on-inverse-muted">
                  Score progression will appear as monthly reputation snapshots are stored.
                </p>
              ) : (
                <div className="space-y-3">
                  {rep.progression.map((p) => (
                  <ProgressItem key={p.month} month={p.month} score={p.score} change={p.change} />
                  ))}
                </div>
              )}
            </div>

            {/* Tips to Improve */}
            <div className="bg-gradient-to-br from-status-pending/10 to-brand-primary/10 border border-status-pending/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Ways to Improve</h3>
              <ul className="space-y-3 text-sm text-text-on-inverse-secondary">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-status-pending rounded-full mt-1.5"></div>
                  <span>Reduce response time to under 4 hours for +5 points</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-status-pending rounded-full mt-1.5"></div>
                  <span>Complete 3 more founder reviews for credibility boost</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-status-pending rounded-full mt-1.5"></div>
                  <span>Provide 2+ portfolio intros this quarter for value-add score</span>
                </li>
              </ul>
            </div>

            {/* Leaderboard Position */}
            <div className="bg-surface-inverse border border-border-inverse rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Leaderboard Position</h3>
              <div className="text-center py-4">
                <p className="text-5xl font-bold font-mono text-status-success mb-2">
                  {hasReputation && rep.leaderboard.rank > 0 ? `#${rep.leaderboard.rank}` : '—'}
                </p>
                <p className="text-sm text-text-on-inverse-muted">
                  {hasReputation && rep.leaderboard.total > 0 ? `out of ${rep.leaderboard.total} investors` : 'No ranking yet'}
                </p>
                <p className="text-xs text-text-on-inverse-disabled mt-2">
                  {hasReputation && rep.leaderboard.percentile > 0 ? `Top ${rep.leaderboard.percentile}%` : 'Live ranking unavailable'}
                </p>
              </div>
              <button className="w-full mt-4 py-2 bg-status-pending/10 hover:bg-status-pending/20 text-status-pending text-sm font-medium rounded transition-all">
                View Full Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-gradient-to-br from-brand-primary/10 to-status-pending/10 border border-status-info/20 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-status-info/20 rounded-lg">
              <Shield className="w-5 h-5 text-status-info" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-status-info mb-2">BALANCED POWER DYNAMICS</h4>
              <p className="text-white mb-2">
                TechIT scores both founders AND investors. This creates mutual accountability.
              </p>
              <p className="text-text-on-inverse-secondary text-sm">
                High reputation investors get early access to top-tier startups. This incentivizes fair treatment, 
                fast responses, and genuine value-add behavior. It's not just about capital—it's about partnership quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScoreMetricProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  score: number;
  description: string;
  color: string;
}

function ScoreMetric({ icon: Icon, label, score, description, color }: ScoreMetricProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="p-3 bg-surface-inverse-muted/50 rounded-lg">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-white">{label}</span>
          <span className={`font-mono font-bold ${color}`}>{score}</span>
        </div>
        <p className="text-sm text-text-on-inverse-muted">{description}</p>
        <div className="h-1.5 bg-surface-inverse-muted rounded-full overflow-hidden mt-2">
          <div
            className={`h-full ${color.replace('text-', 'bg-')}`}
            style={{ width: `${score}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  founderName: string;
  startup: string;
  rating: number;
  comment: string;
  date: string;
}

function ReviewCard({ founderName, startup, rating, comment, date }: ReviewCardProps) {
  return (
    <div className="p-4 bg-surface-inverse-muted/50 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-white">{founderName}</p>
          <p className="text-sm text-text-on-inverse-muted">{startup}</p>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-4 h-4 text-status-warning fill-amber-400" />
          ))}
        </div>
      </div>
      <p className="text-sm text-text-on-inverse-secondary mb-2">{comment}</p>
      <p className="text-xs text-text-on-inverse-disabled">{date}</p>
    </div>
  );
}

interface BenefitItemProps {
  label: string;
  status: 'active' | 'locked';
  description: string;
}

function BenefitItem({ label, status, description }: BenefitItemProps) {
  return (
    <div className={`p-3 rounded-lg ${
      status === 'active' 
        ? 'bg-status-success/10 border border-status-success/20'
        : 'bg-surface-inverse-muted/50 border border-border-inverse-strong'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        {status === 'active' ? (
          <Shield className="w-4 h-4 text-status-success" />
        ) : (
          <Shield className="w-4 h-4 text-text-on-inverse-disabled" />
        )}
        <span className={`font-medium ${status === 'active' ? 'text-status-success' : 'text-text-on-inverse-muted'}`}>
          {label}
        </span>
      </div>
      <p className="text-xs text-text-on-inverse-muted ml-6">{description}</p>
    </div>
  );
}

interface ProgressItemProps {
  month: string;
  score: number;
  change: number;
}

function ProgressItem({ month, score, change }: ProgressItemProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-inverse-muted/50 rounded-lg">
      <span className="text-sm text-text-on-inverse-muted">{month}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono text-white">{score}</span>
        <div className={`flex items-center gap-1 text-sm ${change > 0 ? 'text-status-success' : 'text-text-on-inverse-muted'}`}>
          <TrendingUp className="w-3 h-3" />
          <span>+{change}</span>
        </div>
      </div>
    </div>
  );
}
