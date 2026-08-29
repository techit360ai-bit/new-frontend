import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { gsisColorClass } from '@/lib/messaging/postKinds';
import { useAuth } from '@/contexts/AuthContext';
import {
  connectWithUser,
  fetchPublicUserProfile,
  type PublicUserProfile,
} from '@/lib/api/users';
import { LeftSidebar } from '../components/LeftSidebar';
import { RightPanel } from '../components/RightPanel';
import { BackButton } from '../components/BackButton';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';
import { useFeedPosts } from '../useFeedPosts';
import { IdentityBadges } from '@/components/messaging/IdentityBadges';

function ProfileAvatar({ profile }: { profile: PublicUserProfile }) {
  if (/^(https?:)?\//.test(profile.avatar)) {
    return <img src={profile.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />;
  }
  return <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${profile.avatar}`} />;
}

export function TribePage() {
  const { user } = useAuth();
  const { posts, loading: postsLoading, error: postsError } = useFeedPosts('tribe');
  const [profiles, setProfiles] = useState<PublicUserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  const authorIds = useMemo(
    () => [...new Set(posts.map((post) => post.authorId).filter((id) => id && id !== user?.id))],
    [posts, user?.id],
  );

  useEffect(() => {
    let alive = true;
    if (authorIds.length === 0) {
      setProfiles([]);
      setProfilesError(null);
      setProfilesLoading(false);
      return () => { alive = false; };
    }

    setProfilesLoading(true);
    setProfilesError(null);
    Promise.allSettled(authorIds.map(fetchPublicUserProfile))
      .then((results) => {
        if (!alive) return;
        const liveProfiles = results.flatMap((result) => (
          result.status === 'fulfilled' ? [result.value] : []
        ));
        setProfiles(liveProfiles);
        if (liveProfiles.length === 0) {
          setProfilesError('Live tribe profiles could not be loaded.');
        }
      })
      .finally(() => {
        if (alive) setProfilesLoading(false);
      });

    return () => { alive = false; };
  }, [authorIds]);

  const loading = postsLoading || profilesLoading;
  const error = postsError || profilesError;

  return (
    <div className="flex pb-14 lg:pb-0">
      <LeftSidebar />
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px]">
        <div className="sticky top-14 z-40 border-b border-border-default bg-bg-surface px-6 py-4">
          <BackButton className="mb-3" />
          <h1 className="text-xl font-semibold text-text-primary">Your Tribe</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Members represented in your persisted tribe feed.
          </p>
        </div>

        {loading && <FeedLoadingState label="Loading live tribe members..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && profiles.length === 0 && (
          <FeedEmptyState
            title="No live tribe members yet"
            detail="Profiles appear here after other members publish posts targeted to your role or tribe."
          />
        )}
        {!loading && profiles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 px-4 py-6 md:grid-cols-2">
            {profiles.map((profile) => <TribeMemberCard key={profile.id} profile={profile} />)}
          </div>
        )}
      </main>
      <RightPanel />
    </div>
  );
}

function TribeMemberCard({ profile }: { profile: PublicUserProfile }) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  const connect = async () => {
    setConnecting(true);
    try {
      await connectWithUser(profile.id);
      setConnected(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection request could not be saved.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <article className="border border-border-default bg-bg-surface p-4 sm:rounded-lg">
      <div className="mb-3 flex items-start gap-3">
        <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
          <ProfileAvatar profile={profile} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
            <h2 className="flex items-center gap-1.5 truncate text-sm font-medium text-text-primary hover:text-accent-primary">{profile.name}<IdentityBadges verified={profile.isVerified} subscriber={profile.subscriber} credibilityScore={profile.credibilityScore ?? profile.gsis} compact /></h2>
          </Link>
          <p className="text-xs text-text-secondary">
            {profile.role} · {profile.category} · {profile.stage}
          </p>
          <p className="text-xs text-text-muted">{profile.location}</p>
        </div>
        <div className="text-right">
          <p className={`font-mono text-sm font-semibold ${gsisColorClass(profile.gsis)}`}>{profile.gsis}</p>
          <p className="text-[10px] uppercase text-text-muted">GSIS</p>
        </div>
      </div>

      {profile.bio && <p className="mb-3 text-xs leading-relaxed text-text-secondary">{profile.bio}</p>}

      <div className="mb-3 flex flex-wrap gap-2">
        {profile.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="text-xs text-text-muted">#{skill.replace(/\s+/g, '').toLowerCase()}</span>
        ))}
        {profile.skills.length === 0 && (
          <span className="text-xs text-text-muted">No persisted skills listed.</span>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-border-default pt-3">
        <button
          type="button"
          onClick={() => { void connect(); }}
          disabled={connecting || connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          <UserPlus className="h-4 w-4" />
          {connected ? 'Requested' : connecting ? 'Saving...' : 'Connect'}
        </button>
        <Link
          to={`/feed/messages/${encodeURIComponent(profile.id)}`}
          aria-label={`Message ${profile.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-default text-text-secondary hover:border-accent-primary hover:text-accent-primary"
        >
          <MessageCircle className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
