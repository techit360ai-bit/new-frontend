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
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px] font-bricolage">
        <div className="sticky top-14 z-40 border-b border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl px-6 py-4">
          <BackButton className="mb-2" />
          <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Your Tribe</h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
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
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
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
    <article className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all hover:border-black/20 dark:hover:border-white/20 flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
            <ProfileAvatar profile={profile} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
              <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors">
                {profile.name}
              </h2>
            </Link>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {profile.role} · {profile.category} · {profile.stage}
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{profile.location}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-mono text-sm font-black ${gsisColorClass(profile.gsis)}`}>{profile.gsis}</p>
            <p className="text-[9px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">GSIS</p>
          </div>
        </div>

        {profile.bio && <p className="mb-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{profile.bio}</p>}

        <div className="mb-3 flex flex-wrap gap-1.5">
          {profile.skills.slice(0, 4).map((skill) => (
            <span key={skill} className="text-[11px] font-semibold text-[#0066ff] dark:text-[#58a6ff] bg-[#0066ff]/5 dark:bg-[#58a6ff]/10 px-2 py-0.5 rounded-lg">
              #{skill.replace(/\s+/g, '').toLowerCase()}
            </span>
          ))}
          {profile.skills.length === 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">No persisted skills listed.</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-black/[0.06] dark:border-white/10 pt-3 mt-2">
        <button
          type="button"
          onClick={() => { void connect(); }}
          disabled={connecting || connected}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-3 py-2 text-xs font-bold text-white shadow-md disabled:opacity-60 transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {connected ? 'Requested' : connecting ? 'Saving...' : 'Connect'}
        </button>
        <Link
          to={`/feed/messages/${encodeURIComponent(profile.id)}`}
          aria-label={`Message ${profile.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
