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
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px] font-bricolage">
        <div className="sticky top-16 z-30 border-b border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/90 backdrop-blur-xl px-6 py-4">
          <BackButton className="mb-2" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold text-text-primary">{title}</h1>
              <p className="mt-1 text-sm text-text-secondary">{description}</p>
            </div>
            <Link
              to="/feed"
              className="flex items-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-4 py-2 text-xs font-bold text-slate-950 shadow-md transition-all shrink-0 self-start sm:self-auto"
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
