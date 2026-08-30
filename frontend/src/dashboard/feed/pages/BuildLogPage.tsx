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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:pb-6">
      <BackButton className="mb-6" />
      <div className="mb-6 flex items-start justify-between gap-4 border-b border-border-default pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{name} Build Log</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Verified contribution records and project milestones.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
            <span>{profile?.startupStage || 'Stage not set'}</span>
            <span>GSIS {profile?.credibilityScore ?? 0}</span>
            <span>{contributions.length} contributions</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { void shareLog(); }}
          aria-label="Copy build log link"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:border-accent-primary hover:text-accent-primary"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        {loading && <FeedLoadingState label="Loading your build log..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && contributions.map((contrib) => {
          const gsisArrow = contrib.gsisChange > 0
            ? <ArrowUp className="w-3 h-3 text-status-success" />
            : contrib.gsisChange < 0
            ? <ArrowDown className="w-3 h-3 text-status-error" />
            : <Minus className="w-3 h-3 text-text-disabled" />;
          const gsisColor = contrib.gsisChange > 0
            ? "text-status-success"
            : contrib.gsisChange < 0
            ? "text-status-error"
            : "text-text-muted";
          const endDateText = contrib.endDate
            ? new Date(contrib.endDate).toLocaleDateString()
            : "ongoing";

          return (
            <div key={contrib.id} className="border border-border-default rounded-xl p-4 bg-surface-primary">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-text-primary">{contrib.projectName}</h3>
                    {contrib.verified && (
                      <span className="flex items-center gap-1 text-xs bg-status-success-soft text-status-success px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{contrib.role}</p>
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  {gsisArrow}
                  <span className={`font-semibold tabular-nums ${gsisColor}`}>
                    {contrib.gsisChange > 0 ? '+' : ''}{contrib.gsisChange}
                  </span>
                  <span className="text-text-muted">GSIS</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                <span>{new Date(contrib.startDate).toLocaleDateString()} - {endDateText}</span>
                <span>{contrib.milestonesShipped} milestones shipped</span>
              </div>

              {contrib.technologies.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {contrib.technologies.map((tech) => (
                    <span key={tech} className="text-xs bg-surface-secondary text-text-secondary px-2 py-0.5 rounded">
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
