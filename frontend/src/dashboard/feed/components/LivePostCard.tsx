import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, MessageCircle, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { likePost, unlikePost } from '@/lib/messaging/feed';
import { KIND_META } from '@/lib/messaging/postKinds';
import type { WirePost } from '@/lib/messaging/types';
import { ShareModal } from './ShareModal';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'No timestamp';
  return date.toLocaleString();
}

function kindMeta(kind: string): { label: string; emoji: string } {
  return KIND_META[kind] ?? {
    label: kind.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    emoji: '',
  };
}

function initials(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';
}

export function LivePostCard({
  post,
  authorName,
}: {
  post: WirePost;
  authorName?: string;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState<number | null>(null);
  const [liking, setLiking] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const meta = kindMeta(post.kind);
  const author = authorName || post.authorId;

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const result = liked ? await unlikePost(post.id) : await likePost(post.id);
      if (!result) throw new Error('Reaction endpoint did not return a persisted count.');
      setLiked((current) => !current);
      setLikeCount(result.likeCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reaction could not be saved.');
    } finally {
      setLiking(false);
    }
  };

  return (
    <>
      <article className="border-y border-border-default bg-bg-surface px-4 py-4 sm:rounded-lg sm:border">
        <div className="mb-3 flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(post.authorId)}`} className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-primary text-xs font-semibold text-white">
              {initials(author)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text-primary">{author}</p>
              <p className="text-xs capitalize text-text-secondary">{post.authorRole}</p>
            </div>
          </Link>
          <time className="shrink-0 text-xs text-text-muted" dateTime={post.ts}>
            {formatTimestamp(post.ts)}
          </time>
        </div>

        <Link to={`/feed/post/${encodeURIComponent(post.id)}`} className="block">
          <p className="mb-2 text-[11px] font-medium uppercase text-accent-primary">
            {meta.emoji ? `${meta.emoji} ` : ''}{meta.label}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-primary">{post.body}</p>
        </Link>

        {(post.audience ?? []).length > 0 && !(post.audience ?? []).includes('all') && (
          <p className="mt-3 text-xs text-text-muted">
            Visible to {(post.audience ?? []).join(', ')}
          </p>
        )}

        <div className="mt-4 flex items-center gap-5 border-t border-border-default pt-3">
          <button
            type="button"
            onClick={() => { void toggleLike(); }}
            disabled={liking}
            aria-label={liked ? 'Remove reaction' : 'React to post'}
            className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-score-red disabled:opacity-50"
          >
            <Flame className={`h-4 w-4 ${liked ? 'fill-current text-score-red' : ''}`} />
            {likeCount === null ? 'React' : likeCount}
          </button>
          <Link
            to={`/feed/post/${encodeURIComponent(post.id)}`}
            className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-accent-primary"
          >
            <MessageCircle className="h-4 w-4" />
            Comments
          </Link>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share post"
            className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-accent-primary"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
      </article>

      {shareOpen && (
        <ShareModal
          postId={post.id}
          postTitle={post.body.slice(0, 120)}
          postType={meta.label}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
