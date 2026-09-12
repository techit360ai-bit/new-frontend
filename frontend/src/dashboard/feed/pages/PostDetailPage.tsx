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
    <div className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:pb-6 space-y-6 font-bricolage">
      <BackButton label="Back to Feed" className="mb-2" />

      <article className={`rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm border-l-4 ${kindColorClass(post.kind).split(' ')[0]}`}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(post.authorId)}`} className="flex min-w-0 items-center gap-3 group">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0066ff] to-[#58a6ff] text-sm font-bold text-white shadow-md">
              {initials(authorName)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors">{authorName}</p>
              <p className="text-xs font-semibold capitalize text-slate-500 dark:text-slate-400">
                {author ? `${author.role} · ${author.category} · ${author.stage}` : post.authorRole}
              </p>
            </div>
          </Link>
          <time className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0" dateTime={post.ts}>{formatTimestamp(post.ts)}</time>
        </div>

        <p className={`mb-3 inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider ${kindColorClass(post.kind).split(' ')[1]}`}>
          <KindIcon className="h-4 w-4" aria-hidden="true" />{meta.label}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{post.body}</p>

        <div className="mt-6 flex items-center gap-6 border-t border-black/[0.06] dark:border-white/10 pt-4">
          <button
            type="button"
            onClick={() => { void toggleLike(); }}
            disabled={liking}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 disabled:opacity-50 transition-colors"
          >
            <Flame className={`h-4 w-4 ${liked ? 'fill-amber-500 text-amber-500' : ''}`} />
            {likeCount === null ? 'React' : likeCount}
          </button>
          <span className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <MessageCircle className="h-4 w-4 text-[#0066ff] dark:text-[#58a6ff]" />
            {comments.length} comments
          </span>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </article>

      <section className="rounded-2xl border border-black/[0.08] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-6 backdrop-blur-xl shadow-sm space-y-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Comments ({comments.length})</h2>
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#0066ff] to-[#58a6ff] text-xs font-bold text-white shadow-md">
            {initials(ownName)}
          </div>
          <div className="flex-1 space-y-3">
            <textarea
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              className="min-h-[80px] w-full resize-none rounded-xl border border-black/[0.08] bg-slate-50 p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#0066ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066ff]/20 dark:border-white/10 dark:bg-white/[0.05] dark:text-white dark:placeholder:text-white/40 dark:focus:border-[#58a6ff] dark:focus:bg-white/10"
              placeholder="Share your thoughts..."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { void addComment(); }}
                disabled={!commentText.trim() || commenting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] px-4 py-2 text-xs font-bold text-white shadow-md disabled:opacity-50 transition-all"
              >
                <Send className="h-3.5 w-3.5" />
                {commenting ? 'Saving...' : 'Comment'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} profile={profiles[comment.authorId]} />
          ))}
          {comments.length === 0 && (
            <p className="py-6 text-center text-xs font-semibold text-slate-400 dark:text-slate-500">No persisted comments yet.</p>
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
    <div className="flex gap-3 border-b border-black/[0.06] dark:border-white/10 pb-4 last:border-b-0">
      <Link
        to={`/feed/profile/${encodeURIComponent(comment.authorId)}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/[0.06] text-xs font-bold text-slate-700 dark:text-slate-200"
      >
        {initials(name)}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(comment.authorId)}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors">
            {name}
          </Link>
          <time className="shrink-0 text-[10px] font-mono text-slate-400 dark:text-slate-500" dateTime={comment.ts}>
            {formatTimestamp(comment.ts)}
          </time>
        </div>
        {profile && (
          <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{profile.category} · {profile.stage}</p>
        )}
        <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300">{comment.body}</p>
      </div>
    </div>
  );
}
