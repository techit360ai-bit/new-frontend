import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Flame, MessageCircle, Send, Share2, Tag, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  createComment,
  fetchComments,
  fetchPost,
  likePost,
  unlikePost,
} from '@/lib/messaging/feed';
import { KIND_META, kindColorClass } from '@/lib/messaging/postKinds';
import type { WireComment, WirePost } from '@/lib/messaging/types';
import { fetchPublicUserProfile, type PublicUserProfile } from '@/lib/api/users';
import { ShareModal } from '../components/ShareModal';
import { BackButton } from '../components/BackButton';
import { FeedEmptyState, FeedErrorState, FeedLoadingState } from '../components/FeedStates';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'No timestamp';
  return date.toLocaleString();
}

function initials(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

function postMeta(kind: string): { label: string; icon: LucideIcon } {
  return KIND_META[kind] ?? {
    label: kind.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    icon: Tag,
  };
}

export function PostDetailPage() {
  const params = useParams();
  const postId = params.postId || params.problemId || '';
  const { profile } = useAuth();
  const [post, setPost] = useState<WirePost | null>(null);
  const [comments, setComments] = useState<WireComment[]>([]);
  const [profiles, setProfiles] = useState<Record<string, PublicUserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [liking, setLiking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([fetchPost(postId), fetchComments(postId)])
      .then(([livePost, liveComments]) => {
        if (!alive) return;
        setPost(livePost);
        setComments(liveComments);
      })
      .catch((err) => {
        if (!alive) return;
        setPost(null);
        setComments([]);
        setError(err instanceof Error ? err.message : 'Live post data is unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [postId]);

  const profileIds = useMemo(() => [
    ...new Set([post?.authorId, ...comments.map((comment) => comment.authorId)].filter(Boolean) as string[]),
  ], [comments, post?.authorId]);

  useEffect(() => {
    let alive = true;
    const missing = profileIds.filter((id) => !profiles[id]);
    if (missing.length === 0) return () => { alive = false; };
    Promise.allSettled(missing.map(fetchPublicUserProfile)).then((results) => {
      if (!alive) return;
      const additions = results.reduce<Record<string, PublicUserProfile>>((acc, result) => {
        if (result.status === 'fulfilled') acc[result.value.id] = result.value;
        return acc;
      }, {});
      if (Object.keys(additions).length > 0) {
        setProfiles((current) => ({ ...current, ...additions }));
      }
    });
    return () => { alive = false; };
  }, [profileIds, profiles]);

  const addComment = async () => {
    if (!commentText.trim() || commenting) return;
    setCommenting(true);
    try {
      const created = await createComment(postId, commentText.trim());
      if (!created) throw new Error('Comment was not persisted.');
      setComments((current) => [...current, created]);
      setCommentText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Comment could not be saved.');
    } finally {
      setCommenting(false);
    }
  };

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const result = liked ? await unlikePost(postId) : await likePost(postId);
      if (!result) throw new Error('Reaction was not persisted.');
      setLiked((current) => !current);
      setLikeCount(result.likeCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reaction could not be saved.');
    } finally {
      setLiking(false);
    }
  };

  if (loading) return <FeedLoadingState label="Loading live post..." />;
  if (error) return <FeedErrorState message={error} />;
  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton label="Back to Feed" className="mb-6" />
        <FeedEmptyState
          title="Post not found"
          detail="This post is not present in the persisted feed or is no longer available."
        />
      </div>
    );
  }

  const meta = postMeta(post.kind);
  const KindIcon = meta.icon;
  const author = profiles[post.authorId];
  const authorName = author?.name || post.authorId;
  const ownName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim()
    || profile?.username
    || profile?.email
    || 'You';

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:pb-6">
      <BackButton label="Back to Feed" className="mb-6" />

      <article className={`mb-6 border-y border-border-default border-l-4 bg-bg-surface py-6 sm:rounded-lg sm:border sm:p-6 ${kindColorClass(post.kind).split(' ')[0]}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(post.authorId)}`} className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-primary text-sm font-semibold text-white">
              {initials(authorName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text-primary">{authorName}</p>
              <p className="text-sm capitalize text-text-secondary">
                {author ? `${author.role} · ${author.category} · ${author.stage}` : post.authorRole}
              </p>
            </div>
          </Link>
          <time className="text-xs text-text-muted" dateTime={post.ts}>{formatTimestamp(post.ts)}</time>
        </div>

        <p className={`mb-3 flex items-center gap-1.5 text-xs font-medium uppercase ${kindColorClass(post.kind).split(' ')[1]}`}>
          <KindIcon className="h-4 w-4" aria-hidden="true" />{meta.label}
        </p>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-text-primary">{post.body}</p>

        <div className="mt-6 flex items-center gap-6 border-t border-border-default pt-4">
          <button
            type="button"
            onClick={() => { void toggleLike(); }}
            disabled={liking}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-score-red disabled:opacity-50"
          >
            <Flame className={`h-5 w-5 ${liked ? 'fill-current text-score-red' : ''}`} />
            {likeCount === null ? 'React' : likeCount}
          </button>
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <MessageCircle className="h-5 w-5" />
            {comments.length} comments
          </span>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 text-sm text-text-secondary hover:text-accent-primary"
          >
            <Share2 className="h-5 w-5" />
            Share
          </button>
        </div>
      </article>

      <section className="border-y border-border-default bg-bg-surface py-6 sm:rounded-lg sm:border sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-text-primary">Comments ({comments.length})</h2>
        <div className="mb-6 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-semibold text-white">
            {initials(ownName)}
          </div>
          <div className="flex-1">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="min-h-[80px] w-full resize-none rounded-lg bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-primary"
              placeholder="Share your thoughts..."
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => { void addComment(); }}
                disabled={!commentText.trim() || commenting}
                className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {commenting ? 'Saving...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} profile={profiles[comment.authorId]} />
          ))}
          {comments.length === 0 && (
            <p className="py-6 text-center text-sm text-text-muted">No persisted comments yet.</p>
          )}
        </div>
      </section>

      {shareOpen && (
        <ShareModal
          postId={post.id}
          postTitle={post.body.slice(0, 120)}
          postType={meta.label}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

function CommentItem({
  comment,
  profile,
}: {
  comment: WireComment;
  profile?: PublicUserProfile;
}) {
  const name = profile?.name || comment.authorId;
  return (
    <div className="flex gap-3 border-b border-border-default pb-4 last:border-b-0">
      <Link
        to={`/feed/profile/${encodeURIComponent(comment.authorId)}`}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-elevated text-xs font-semibold text-text-primary"
      >
        {initials(name)}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(comment.authorId)}`} className="text-sm font-medium text-text-primary hover:text-accent-primary">
            {name}
          </Link>
          <time className="shrink-0 text-xs text-text-muted" dateTime={comment.ts}>
            {formatTimestamp(comment.ts)}
          </time>
        </div>
        {profile && (
          <p className="text-xs text-text-secondary">{profile.category} · {profile.stage}</p>
        )}
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{comment.body}</p>
      </div>
    </div>
  );
}
