import { useEffect, useState } from 'react';
import { Award, TrendingUp, Star, Clock, Heart, Zap, Shield, Sparkles } from 'lucide-react';
import { EMPTY_REPUTATION, fetchInvestorReputation } from '@/lib/api/investorReputation';

const METRIC_STYLE: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  responseSpeed:       { icon: Clock,       color: 'text-[#20C997]' },
  founderRating:       { icon: Star,        color: 'text-amber-600 dark:text-amber-400' },
  followThrough:       { icon: Zap,         color: 'text-purple-600 dark:text-purple-400' },
  valueAdd:            { icon: Heart,       color: 'text-pink-600 dark:text-pink-400' },
  portfolioEngagement: { icon: TrendingUp,  color: 'text-[#20C997]' },
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors duration-200">
      {/* Header Banner */}
      <div className="border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-4 py-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Investor Reputation Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Power Dynamics
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
              Mutual accountability, founder feedback, and institutional trust scoring
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-6 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            Loading live reputation...
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Score Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Score Card */}
            <div className="bg-gradient-to-br from-[#20C997]/15 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1">Your Reputation Score</h2>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">Based on verified founder feedback and deployment telemetry</p>
                </div>
                <div className="p-3.5 bg-[#20C997]/20 rounded-2xl shrink-0">
                  <Award className="w-8 h-8 text-[#20C997]" />
                </div>
              </div>
              
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-5xl sm:text-6xl font-bold font-mono text-[#20C997]">{investorScore}</span>
                <span className="text-xl sm:text-2xl text-slate-400 font-medium">/100</span>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-[#20C997]/20 text-[#20C997] rounded-full text-xs sm:text-sm font-bold">
                  {scoreLevel} Tier
                </span>
                <div className="flex items-center gap-1 text-[#20C997] text-xs sm:text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {rep.monthChange >= 0 ? `+${rep.monthChange}` : rep.monthChange} points this month
                  </span>
                </div>
              </div>
              
              <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#20C997]"
                  style={{ width: `${investorScore}%` }}
                ></div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Reputation Metrics</h3>
              {rep.metrics.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Reputation metrics will appear after founders submit feedback and engagement events are persisted.
                </p>
              ) : (
                <div className="space-y-5">
                  {rep.metrics.map((m) => {
                    const style = METRIC_STYLE[m.key] ?? { icon: Star, color: 'text-[#20C997]' };
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
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Founder Reviews</h3>
              {rep.reviews.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#20C997]" />
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
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Score Progression</h3>
              {rep.progression.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
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
            <div className="bg-gradient-to-br from-purple-500/10 to-indigo-500/5 border border-purple-500/20 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Ways to Improve Score</h3>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                  <span>Reduce response time to under 4 hours for +5 points boost</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                  <span>Complete 3 more founder reviews for credibility boost</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-1.5 shrink-0"></div>
                  <span>Provide 2+ portfolio intros this quarter for value-add score</span>
                </li>
              </ul>
            </div>

            {/* Leaderboard Position */}
            <div className="bg-white dark:bg-[#111111] border border-black/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Leaderboard Position</h3>
              <div className="text-center py-4">
                <p className="text-4xl sm:text-5xl font-bold font-mono text-[#20C997] mb-1">
                  {hasReputation && rep.leaderboard.rank > 0 ? `#${rep.leaderboard.rank}` : '—'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {hasReputation && rep.leaderboard.total > 0 ? `out of ${rep.leaderboard.total} investors` : 'No ranking yet'}
                </p>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  {hasReputation && rep.leaderboard.percentile > 0 ? `Top ${rep.leaderboard.percentile}%` : 'Live ranking unavailable'}
                </p>
              </div>
              <button className="w-full mt-2 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold rounded-xl transition-all">
                View Full Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-br from-[#20C997]/10 to-teal-500/5 border border-[#20C997]/20 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-2.5 bg-[#20C997]/20 rounded-xl shrink-0">
              <Shield className="w-5 h-5 text-[#20C997]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#20C997] uppercase tracking-wider mb-1">BALANCED POWER DYNAMICS</h4>
              <p className="text-slate-900 dark:text-white font-medium text-sm mb-1">
                TechIT scores both founders AND investors, ensuring mutual accountability.
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                High-reputation investors get early access to top-tier startups, incentivizing fast responses and authentic support.
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
      <div className="p-3 bg-slate-100 dark:bg-white/[0.06] rounded-xl shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{label}</span>
          <span className={`font-mono font-bold text-sm ${color}`}>{score}</span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">{description}</p>
        <div className="h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#20C997]"
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
    <div className="p-4 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{founderName}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{startup}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {[...Array(rating)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-700 dark:text-slate-300 mb-2 leading-relaxed">{comment}</p>
      <p className="text-[10px] text-slate-400">{date}</p>
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
    <div className={`p-3 rounded-xl border ${
      status === 'active' 
        ? 'bg-[#20C997]/10 border-[#20C997]/20' 
        : 'bg-slate-50 dark:bg-white/[0.03] border-black/[0.04] dark:border-white/5'
    }`}>
      <div className="flex items-center gap-2 mb-1">
        <Shield className={`w-4 h-4 ${status === 'active' ? 'text-[#20C997]' : 'text-slate-400'}`} />
        <span className={`text-xs font-bold ${status === 'active' ? 'text-[#20C997]' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 ml-6">{description}</p>
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
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/5 rounded-xl text-xs">
      <span className="text-slate-600 dark:text-slate-400 font-medium">{month}</span>
      <div className="flex items-center gap-3">
        <span className="font-mono font-bold text-slate-900 dark:text-white">{score}</span>
        <div className={`flex items-center gap-1 font-semibold ${change > 0 ? 'text-[#20C997]' : 'text-slate-400'}`}>
          <TrendingUp className="w-3 h-3" />
          <span>+{change}</span>
        </div>
      </div>
    </div>
  );
}
