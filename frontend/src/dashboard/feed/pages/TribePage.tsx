import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, UserPlus, Users, Search } from 'lucide-react';
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
  const [query, setQuery] = useState('');

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

  const filteredProfiles = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.skills.some((s) => s.toLowerCase().includes(q))
    ));
  }, [profiles, query]);

  const loading = postsLoading || profilesLoading;
  const error = postsError || profilesError;

  return (
    <div className="flex pb-14 lg:pb-0">
      <LeftSidebar />
      <main className="min-w-0 flex-1 lg:mx-auto lg:max-w-[720px] font-bricolage">
        <div className="sticky top-16 z-30 border-b border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] px-6 py-4 space-y-3">
          <BackButton className="mb-1" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                <Users className="h-6 w-6 text-[#20C997]" />
                Your Tribe
              </h1>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {profiles.length} connected members in your network
              </p>
            </div>
            {profiles.length > 0 && (
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-white/40" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter tribe members..."
                  className="h-8 w-full rounded-xl border border-black/[0.08] bg-slate-50 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#20C997] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#20C997] dark:focus:bg-white/10"
                />
              </div>
            )}
          </div>
        </div>

        {loading && <FeedLoadingState label="Loading live tribe members..." />}
        {!loading && error && <FeedErrorState message={error} />}
        {!loading && !error && filteredProfiles.length === 0 && (
          <FeedEmptyState
            title={query ? "No matching tribe members" : "No live tribe members yet"}
            detail={query ? `No members match "${query}". Try searching by name, role, or skills.` : "Profiles appear here after other members publish posts targeted to your role or tribe."}
          />
        )}
        {!loading && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            {filteredProfiles.map((profile) => <TribeMemberCard key={profile.id} profile={profile} />)}
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
    <article className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 shadow-sm transition-all hover:border-[#20C997]/30 flex flex-col justify-between">
      <div>
        <div className="mb-3 flex items-start gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
            <ProfileAvatar profile={profile} />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to={`/feed/profile/${encodeURIComponent(profile.id)}`}>
              <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white hover:text-[#20C997] transition-colors">
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
            <span key={skill} className="text-[11px] font-semibold text-[#20C997] bg-[#20C997]/10 border border-[#20C997]/20 px-2 py-0.5 rounded-lg">
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-3 py-2 text-xs font-bold text-slate-950 shadow-sm disabled:opacity-60 transition-all"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {connected ? 'Requested' : connecting ? 'Saving...' : 'Connect'}
        </button>
        <Link
          to={`/feed/messages/${encodeURIComponent(profile.id)}`}
          aria-label={`Message ${profile.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#20C997]/20 bg-[#20C997]/10 hover:bg-[#20C997]/20 text-[#20C997] transition-colors shrink-0"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}
