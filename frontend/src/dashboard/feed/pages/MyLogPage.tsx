import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BackButton } from '../components/BackButton';
import { LivePostCard } from '../components/LivePostCard';
import { gsisColorClass } from '@/lib/messaging/postKinds';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';

function displayName(firstName?: string, lastName?: string, email?: string): string {
  return `${firstName ?? ''} ${lastName ?? ''}`.trim() || email || 'User';
}

function formatDate(value?: string): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function MyLogPage() {
  const { profile, user } = useAuth();
  const { posts, loading, error } = useFeedPosts('global');
  const ownerId = profile?.id || user?.id;
  const ownPosts = posts.filter((post) => post.authorId === ownerId);
  const name = displayName(profile?.firstName, profile?.lastName, profile?.email);
  const buildCount = ownPosts.filter((post) => (
    post.kind === 'milestone' || post.kind === 'build-update' || post.kind === 'build'
  )).length;
  const questionCount = ownPosts.filter((post) => post.kind === 'question').length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20">
      <BackButton className="mb-6" />

      <section className="mb-6 border-y border-border-default py-6 sm:rounded-lg sm:border sm:p-6">
        <p className="text-xs font-medium uppercase text-text-muted">Your live activity</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{name}</h1>
            <p className="text-sm capitalize text-text-secondary">
              {profile?.role || 'Role unavailable'} · {profile?.startupStage || 'Stage not set'}
            </p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-4xl font-bold ${gsisColorClass(profile?.credibilityScore ?? 0)}`}>
              {profile?.credibilityScore ?? 0}
            </p>
            <p className="text-xs text-text-muted">GSIS</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-default pt-5 sm:grid-cols-4">
          <Metric label="Posts" value={ownPosts.length} />
          <Metric label="Build updates" value={buildCount} />
          <Metric label="Questions" value={questionCount} />
          <Metric label="Joined" value={formatDate(profile?.createdAt)} />
        </div>
      </section>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text-primary">Recent persisted posts</h2>
        <Link to="/feed/build-log" className="text-xs text-accent-primary hover:underline">
          Build log
        </Link>
      </div>

      <div className="space-y-3">
        {loading && <FeedLoadingState label="Loading your live activity..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && ownPosts.slice(0, 6).map((post) => (
          <LivePostCard key={post.id} post={post} authorName={name} />
        ))}
        {!loading && !error && ownPosts.length === 0 && (
          <FeedEmptyState
            title="No persisted posts yet"
            detail="Your posts, questions, and build updates will appear here after you publish them."
          />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}
