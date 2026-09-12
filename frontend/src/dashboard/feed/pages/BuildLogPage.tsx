import { Share2, CheckCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '../components/BackButton';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useEffect, useState } from 'react';
import { fetchContributions, type ContributionRecord } from '@/lib/api/contributions';

function displayName(firstName?: string, lastName?: string, email?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || email || 'Your';
}

export function BuildLogPage() {
  const { profile } = useAuth();
  const [contributions, setContributions] = useState<ContributionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const name = displayName(profile?.firstName, profile?.lastName, profile?.email);

  useEffect(() => {
    let alive = true;
    fetchContributions()
      .then((data) => {
        if (!alive) return;
        setContributions(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setContributions([]);
        setError(err instanceof Error ? err.message : "Failed to load contributions");
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => { alive = false; };
  }, []);

  const shareLog = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Build log link copied.');
    } catch {
      toast.error('Build log link could not be copied.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 lg:pb-6 space-y-6 font-bricolage">
      <BackButton className="mb-2" />
      
      {/* Header Glass Card */}
      <div className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{name} Build Log</h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Verified contribution records and project milestones across the TechIT ecosystem.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-xl bg-slate-100 dark:bg-white/[0.06] px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
              {profile?.startupStage || 'Stage not set'}
            </span>
            <span className="rounded-xl bg-[#0066ff]/10 text-[#0066ff] dark:bg-[#58a6ff]/10 dark:text-[#58a6ff] px-3 py-1 font-bold">
              GSIS {profile?.credibilityScore ?? 0}
            </span>
            <span className="rounded-xl bg-slate-100 dark:bg-white/[0.06] px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
              {contributions.length} contributions
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { void shareLog(); }}
          aria-label="Copy build log link"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 dark:hover:bg-white/10 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {loading && <FeedLoadingState label="Loading your build log..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && contributions.map((contrib) => {
          const gsisArrow = contrib.gsisChange > 0
            ? <ArrowUp className="w-3.5 h-3.5 text-[#20c937]" />
            : contrib.gsisChange < 0
            ? <ArrowDown className="w-3.5 h-3.5 text-red-500" />
            : <Minus className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />;
          const gsisColor = contrib.gsisChange > 0
            ? "text-[#20c937]"
            : contrib.gsisChange < 0
            ? "text-red-500"
            : "text-slate-500 dark:text-slate-400";
          const endDateText = contrib.endDate
            ? new Date(contrib.endDate).toLocaleDateString()
            : "ongoing";

          return (
            <div
              key={contrib.id}
              className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-black/20 dark:hover:border-white/20"
            >
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">{contrib.projectName}</h3>
                    {contrib.verified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#20c937]/15 text-[#20c937] px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">{contrib.role}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold shrink-0">
                  {gsisArrow}
                  <span className={`tabular-nums ${gsisColor}`}>
                    {contrib.gsisChange > 0 ? '+' : ''}{contrib.gsisChange}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">GSIS</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                <span>{new Date(contrib.startDate).toLocaleDateString()} - {endDateText}</span>
                <span>•</span>
                <span>{contrib.milestonesShipped} milestones shipped</span>
              </div>

              {contrib.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {contrib.technologies.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-black/[0.04] dark:border-white/5"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!loading && !error && contributions.length === 0 && (
          <FeedEmptyState
            title="No contributions recorded yet"
            detail="Complete verified projects to build your contribution log."
          />
        )}
      </div>
    </div>
  );
}
