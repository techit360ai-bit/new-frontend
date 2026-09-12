import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, ExternalLink, Mail, MapPin, MessageCircle, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  connectWithUser,
  fetchPublicUserProfile,
  type PublicUserProfile,
} from '@/lib/api/users';
import { BackButton } from '../components/BackButton';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

function ProfileAvatar({ profile }: { profile: PublicUserProfile }) {
  if (/^(https?:)?\//.test(profile.avatar)) {
    return <img src={profile.avatar} alt="" className="h-24 w-24 rounded-full object-cover" />;
  }
  return <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${profile.avatar}`} />;
}

function settingsPath(role: string): string {
  if (role === 'collaborator') return '/collaborator/settings';
  if (role === 'organisation') return '/org/settings';
  if (role === 'investor') return '/investor/profile';
  return '/founder/settings';
}

export function UserProfilePage() {
  const { userId = 'me' } = useParams();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    fetchPublicUserProfile(userId)
      .then((liveProfile) => {
        if (alive) setProfile(liveProfile);
      })
      .catch((err) => {
        if (!alive) return;
        setProfile(null);
        setError(err instanceof Error ? err.message : 'Live profile is unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [userId]);

  const connect = async () => {
    setConnecting(true);
    try {
      await connectWithUser(userId);
      setConnected(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Connection request could not be saved.');
    } finally {
      setConnecting(false);
    }
  };

  if (loading) return <FeedLoadingState label="Loading live profile..." />;
  if (error) return <FeedErrorState message={error} />;
  if (!profile) {
    return (
      <FeedEmptyState
        title="Profile not found"
        detail="This persisted profile is no longer available."
      />
    );
  }

  const website = profile.website
    ? (/^https?:\/\//.test(profile.website) ? profile.website : `https://${profile.website}`)
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 lg:pb-6 space-y-6 font-bricolage">
      {!profile.isOwnProfile && <BackButton label="Back" className="mb-2" />}

      {/* Main Profile Glass Card */}
      <section className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <ProfileAvatar profile={profile} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{profile.name}</h1>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {profile.role} · {profile.category} · {profile.stage}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{profile.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-slate-400" />Joined {formatDate(profile.joinedDate)}</span>
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#0066ff] dark:text-[#58a6ff] font-bold hover:underline">
                      <ExternalLink className="h-3.5 w-3.5" />Website
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <p className="font-mono text-3xl font-black text-[#0066ff] dark:text-[#58a6ff]">{profile.gsis}</p>
                <p className="text-[10px] font-mono tracking-wider uppercase text-slate-400 dark:text-slate-500">GSIS Score</p>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{profile.bio}</p>
            ) : (
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">No persisted bio has been added.</p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {profile.isOwnProfile ? (
                <Link
                  to={settingsPath(profile.role)}
                  className="rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
                >
                  Edit profile
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { void connect(); }}
                    disabled={connecting || connected}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-5 py-2.5 text-xs font-bold text-white shadow-md disabled:opacity-60 transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    {connected ? 'Requested' : connecting ? 'Saving...' : 'Connect'}
                  </button>
                  <Link
                    to={`/feed/messages/${encodeURIComponent(profile.id)}`}
                    className="flex items-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/10 px-5 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors shadow-sm"
                  >
                    <MessageCircle className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
                    Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 border-t border-black/[0.06] dark:border-white/10 pt-6 sm:grid-cols-5">
          <Metric label="Stage progress" value={`${profile.stats.stageProgress}%`} />
          <Metric label="Posts" value={profile.stats.posts} />
          <Metric label="Answers" value={profile.stats.answers} />
          <Metric label="Connections" value={profile.stats.connections} />
          <Metric label="Decay" value={profile.stats.decay} />
        </div>
      </section>

      {/* Grid for Activity and Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm lg:col-span-2 space-y-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Recent activity</h2>
          {profile.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {profile.recentActivity.map((activity) => (
                <div key={activity.id} className="border-b border-black/[0.06] dark:border-white/10 pb-3 last:border-b-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{activity.title}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">{activity.type} · {activity.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">No persisted profile activity yet.</p>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Skills & interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-xl border border-black/[0.04] dark:border-white/5 bg-slate-100 dark:bg-white/[0.06] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  {skill}
                </span>
              ))}
              {profile.skills.length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No persisted skills listed.</p>}
            </div>
          </section>

          {profile.email && (
            <section className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Contact</h2>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-xs font-bold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
                <Mail className="h-4 w-4" />{profile.email}
              </a>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3 text-center border border-black/[0.04] dark:border-white/5">
      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-base font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
