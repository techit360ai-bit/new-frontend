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
    <div className="mx-auto max-w-4xl px-4 py-6 pb-20 lg:pb-6">
      {!profile.isOwnProfile && <BackButton label="Back" className="mb-6" />}

      <section className="mb-6 border-y border-border-default bg-surface-primary py-6 sm:rounded-lg sm:border sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          <ProfileAvatar profile={profile} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <h1 className="text-2xl font-semibold text-text-primary">{profile.name}</h1>
                <p className="mt-1 text-text-secondary">
                  {profile.role} · {profile.category} · {profile.stage}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.location}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Joined {formatDate(profile.joinedDate)}</span>
                  {website && (
                    <a href={website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent-primary hover:underline">
                      <ExternalLink className="h-4 w-4" />Website
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-left md:text-right">
                <p className="font-mono text-3xl font-bold text-accent-primary">{profile.gsis}</p>
                <p className="text-xs text-text-muted">GSIS</p>
              </div>
            </div>

            {profile.bio ? (
              <p className="mt-4 text-sm leading-relaxed text-text-primary">{profile.bio}</p>
            ) : (
              <p className="mt-4 text-sm text-text-muted">No persisted bio has been added.</p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {profile.isOwnProfile ? (
                <Link to={settingsPath(profile.role)} className="rounded-lg border border-border-default px-5 py-2.5 text-sm font-medium text-text-primary hover:border-accent-primary">
                  Edit profile
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => { void connect(); }}
                    disabled={connecting || connected}
                    className="flex items-center gap-2 rounded-lg bg-accent-primary px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                  >
                    <UserPlus className="h-4 w-4" />
                    {connected ? 'Requested' : connecting ? 'Saving...' : 'Connect'}
                  </button>
                  <Link
                    to={`/feed/messages/${encodeURIComponent(profile.id)}`}
                    className="flex items-center gap-2 rounded-lg border border-border-default px-5 py-2.5 text-sm text-text-primary hover:border-accent-primary"
                  >
                    <MessageCircle className="h-4 w-4" />Message
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border-default pt-6 md:grid-cols-5">
          <Metric label="Stage progress" value={`${profile.stats.stageProgress}%`} />
          <Metric label="Posts" value={profile.stats.posts} />
          <Metric label="Answers" value={profile.stats.answers} />
          <Metric label="Connections" value={profile.stats.connections} />
          <Metric label="Decay" value={profile.stats.decay} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="border-y border-border-default bg-surface-primary py-6 sm:rounded-lg sm:border sm:p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent activity</h2>
          {profile.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {profile.recentActivity.map((activity) => (
                <div key={activity.id} className="border-b border-border-default pb-3 last:border-b-0">
                  <p className="text-sm font-medium text-text-primary">{activity.title}</p>
                  <p className="mt-1 text-xs text-text-muted">{activity.type} · {activity.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No persisted profile activity yet.</p>
          )}
        </section>

        <div className="space-y-6">
          <section className="border-y border-border-default bg-surface-primary py-6 sm:rounded-lg sm:border sm:p-6">
            <h2 className="mb-4 text-base font-semibold text-text-primary">Skills & interests</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span key={skill} className="rounded-lg border border-border-default bg-surface-secondary px-3 py-1.5 text-xs text-text-secondary">
                  {skill}
                </span>
              ))}
              {profile.skills.length === 0 && <p className="text-sm text-text-muted">No persisted skills listed.</p>}
            </div>
          </section>

          {profile.trust && (
            <section className="border-y border-border-default bg-surface-primary py-6 sm:rounded-lg sm:border sm:p-6">
              <h2 className="mb-2 text-base font-semibold text-text-primary">External verification</h2>
              <p className="text-sm text-text-secondary">{profile.trust.tier} · {Math.round(profile.trust.trust_score)}/100</p>
              {profile.verifiedSkills?.length ? <div className="mt-3 flex flex-wrap gap-2">{profile.verifiedSkills.slice(0, 12).map((item) => <span key={`${item.skill}-${item.source}`} className="rounded-lg border border-status-success bg-status-success-soft px-2 py-1 text-xs text-status-success">{item.skill}</span>)}</div> : <p className="mt-2 text-xs text-text-muted">No externally verified skills yet.</p>}
            </section>
          )}

          {profile.email && (
            <section className="border-y border-border-default bg-surface-primary py-6 sm:rounded-lg sm:border sm:p-6">
              <h2 className="mb-4 text-base font-semibold text-text-primary">Contact</h2>
              <a href={`mailto:${profile.email}`} className="flex items-center gap-3 text-sm text-accent-primary hover:underline">
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
    <div>
      <p className="text-xs uppercase text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-text-primary">{value}</p>
    </div>
  );
}
