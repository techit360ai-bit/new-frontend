import { Link } from 'react-router-dom';
import { LeftSidebar } from './LeftSidebar';
import { RightPanel } from './RightPanel';
import { BackButton } from './BackButton';
import { LivePostCard } from './LivePostCard';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from './FeedStates';
import { useFeedPosts } from '../useFeedPosts';

export function LivePostListPage({
  title,
  description,
  kinds,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  description: string;
  kinds: string[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  const { posts, loading, error, stale, lastSyncedAt } = useFeedPosts('global');
  const filtered = posts.filter((post) => kinds.includes(post.kind));

  return (
    <div className="flex pb-14 lg:pb-0">
      <LeftSidebar />
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px]">
        <div className="sticky top-14 z-40 border-b border-border-default bg-surface-primary px-6 py-4">
          <BackButton className="mb-3" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            </div>
            <Link
              to="/feed"
              className="shrink-0 text-sm font-medium text-accent-primary hover:underline"
            >
              Create post
            </Link>
          </div>
        </div>

        <div className="space-y-3 py-4 sm:px-4">
          {stale && <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Showing cached posts from {lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : 'your last sync'}.</div>}
          {loading && <FeedLoadingState />}
          {!loading && error && <FeedErrorState message={error} />}
          {!loading && !error && filtered.map((post) => <LivePostCard key={post.id} post={post} />)}
          {!loading && !error && filtered.length === 0 && (
            <FeedEmptyState title={emptyTitle} detail={emptyDetail} />
          )}
        </div>
      </main>
      <RightPanel />
    </div>
  );
}
