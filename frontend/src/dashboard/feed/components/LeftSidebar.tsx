import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeedPosts } from '../useFeedPosts';
import { gsisColorClass } from '@/lib/messaging/postKinds';

export function LeftSidebar() {
  const { profile, user } = useAuth();
  const { posts, loading } = useFeedPosts('global');
  const ownerId = profile?.id || user?.id;
  const ownPosts = posts.filter((post) => post.authorId === ownerId);
  const name = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
    || profile?.username
    || profile?.email
    || 'User';

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-[260px] overflow-y-auto border-r border-border-default bg-surface-primary p-5 lg:block">
      <section className="mb-6">
        <p className="mb-2 text-[11px] font-medium uppercase text-text-muted">Your profile</p>
        <Link to="/feed/profile/me" className="text-[15px] font-medium text-text-primary hover:text-accent-primary">
          {name}
        </Link>
        <p className="mt-1 text-xs capitalize text-text-secondary">
          {profile?.role || 'Role unavailable'} · {profile?.startupStage || 'Stage not set'}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-default pt-4">
          <div><p className="text-[11px] text-text-muted">GSIS</p><p className={`mt-1 font-mono text-base font-semibold ${gsisColorClass(profile?.credibilityScore ?? 0)}`}>{profile?.credibilityScore ?? 0}</p></div>
          <Metric label="Posts" value={loading ? '...' : ownPosts.length} />
        </div>
      </section>

      <section className="mb-6">
        <p className="mb-2 text-[11px] font-medium uppercase text-text-muted">Hangout</p>
        <div className="space-y-1">
          <MenuItem to="/feed" label="Global Pulse" />
          <MenuItem to="/feed/tribe" label="Your Tribe" />
          <MenuItem to="/feed/build-log" label="Build Logs" />
          <MenuItem to="/feed/questions" label="Questions" />
          <MenuItem to="/feed/problems" label="Problem Signals" />
          <MenuItem to="/feed/messages" label="Messages" />
        </div>
      </section>

      <section className="border-t border-border-default pt-4">
        <p className="mb-2 text-[11px] font-medium uppercase text-text-muted">Live data</p>
        <p className="text-xs leading-relaxed text-text-muted">
          Presence and unread counts will appear when the messaging service exposes persisted read models for them.
        </p>
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

function MenuItem({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="block rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary">
      {label}
    </Link>
  );
}
