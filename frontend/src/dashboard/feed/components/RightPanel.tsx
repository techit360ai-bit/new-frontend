import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedPosts } from '../useFeedPosts';
import { gsisColorClass } from '@/lib/messaging/postKinds';

export function RightPanel() {
  const { profile, user } = useAuth();
  const { posts, loading, error } = useFeedPosts('global');
  const ownerId = profile?.id || user?.id;
  const ownPosts = posts.filter((post) => post.authorId === ownerId);
  const contributors = [...new Map(
    posts
      .filter((post) => post.authorId !== ownerId)
      .map((post) => [post.authorId, post]),
  ).values()].slice(0, 4);
  const problems = posts.filter((post) => post.kind === 'problem').slice(0, 3);

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[320px] overflow-y-auto p-5 xl:block">
      <section className="border border-border-default bg-bg-surface p-5 sm:rounded-lg">
        <p className="text-[11px] font-medium uppercase text-text-muted">Your live activity</p>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-text-primary">
              {profile?.startupStage || 'Stage not set'}
            </p>
            <p className="text-xs capitalize text-text-secondary">{profile?.role || 'Role unavailable'}</p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-3xl font-bold ${gsisColorClass(profile?.credibilityScore ?? 0)}`}>{profile?.credibilityScore ?? 0}</p>
            <p className="text-[10px] uppercase text-text-muted">GSIS</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
          <Metric label="Posts" value={loading ? '...' : ownPosts.length} />
          <Metric label="Questions" value={loading ? '...' : ownPosts.filter((post) => post.kind === 'question').length} />
        </div>
        {error && <p className="mt-4 text-xs text-red-300">{error}</p>}
      </section>

      <section className="mt-4 border border-border-default bg-bg-surface p-5 sm:rounded-lg">
        <p className="mb-3 text-[11px] font-medium uppercase text-text-muted">Recent contributors</p>
        <div className="space-y-3">
          {contributors.map((post) => (
            <Link key={post.authorId} to={`/feed/profile/${encodeURIComponent(post.authorId)}`} className="block">
              <p className="truncate text-xs font-medium text-text-primary">{post.authorId}</p>
              <p className="text-[11px] capitalize text-text-secondary">{post.authorRole}</p>
            </Link>
          ))}
          {!loading && contributors.length === 0 && (
            <p className="text-xs text-text-muted">No other persisted contributors yet.</p>
          )}
        </div>
      </section>

      <section className="mt-4 border border-border-default bg-bg-surface p-5 sm:rounded-lg">
        <p className="mb-3 text-[11px] font-medium uppercase text-text-muted">Problem signals</p>
        <div className="space-y-3">
          {problems.map((post) => (
            <Link key={post.id} to={`/feed/problem/${encodeURIComponent(post.id)}`} className="block border-b border-border-default pb-3 last:border-b-0">
              <p className="line-clamp-2 text-xs leading-relaxed text-text-primary">{post.body}</p>
              <p className="mt-1 text-[11px] text-text-muted">{post.authorId}</p>
            </Link>
          ))}
          {!loading && problems.length === 0 && (
            <p className="text-xs text-text-muted">No persisted problem signals yet.</p>
          )}
        </div>
      </section>
    </aside>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[11px] text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-base font-semibold text-text-primary">{value}</p>
    </div>
  );
}
