import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { LivePostCard } from '../components/LivePostCard';
import { BackButton } from '../components/BackButton';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';

const BUILD_KINDS = new Set(['milestone', 'build-update', 'build', 'update']);

function displayName(firstName?: string, lastName?: string, email?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || email || 'Your';
}

export function BuildLogPage() {
  const { profile, user } = useAuth();
  const { posts, loading, error } = useFeedPosts('global');
  const ownerId = profile?.id || user?.id;
  const buildPosts = posts.filter((post) => (
    post.authorId === ownerId && BUILD_KINDS.has(post.kind)
  ));
  const name = displayName(profile?.firstName, profile?.lastName, profile?.email);

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
            Persisted milestones and build updates from your account.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-text-muted">
            <span>{profile?.startupStage || 'Stage not set'}</span>
            <span>GSIS {profile?.credibilityScore ?? 0}</span>
            <span>{buildPosts.length} updates</span>
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
        {loading && <FeedLoadingState label="Loading your live build log..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && buildPosts.map((post) => (
          <LivePostCard key={post.id} post={post} authorName={name} />
        ))}
        {!loading && !error && buildPosts.length === 0 && (
          <FeedEmptyState
            title="No persisted build updates yet"
            detail="Publish a milestone or build update from the feed composer to start your build log."
          />
        )}
      </div>
    </div>
  );
}
