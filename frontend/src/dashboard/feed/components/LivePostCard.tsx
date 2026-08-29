import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Bookmark, EyeOff, Flag, Flame, MessageCircle, Share2, Tag, VolumeX, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { likePost, unlikePost } from '@/lib/messaging/feed';
import { KIND_META, kindColorClass } from '@/lib/messaging/postKinds';
import type { WirePost } from '@/lib/messaging/types';
import { ShareModal } from './ShareModal';
import { blockUser, muteUser, postFeedback, savePost, unsavePost } from '@/lib/messaging/discovery';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'No timestamp';
  return date.toLocaleString();
}

function kindMeta(kind: string): { label: string; icon: LucideIcon } {
  return KIND_META[kind] ?? {
    label: kind.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    icon: Tag,
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
  const [saved, setSaved] = useState(false);
  const [hidden, setHidden] = useState(false);
  const meta = kindMeta(post.kind);
  const KindIcon = meta.icon;
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

  const toggleSave = async () => {
    const result = saved ? await unsavePost(post.id) : await savePost(post.id);
    if (!result) { toast.error('Save could not be persisted.'); return; }
    setSaved(result.saved);
  };

  const hidePost = async () => {
    const result = await postFeedback(post.id, 'not_interested');
    if (!result) { toast.error('Feedback could not be persisted.'); return; }
    setHidden(true);
  };

  const controlCreator = async (control: 'mute' | 'block') => {
    const result = control === 'mute' ? await muteUser(post.authorId) : await blockUser(post.authorId);
    if (!result) { toast.error(`${control} could not be persisted.`); return; }
    setHidden(true);
    toast.success(control === 'mute' ? 'Creator muted.' : 'Creator blocked.');
  };

  const reportPost = async () => {
    const result = await postFeedback(post.id, 'report');
    if (!result) { toast.error('Report could not be persisted.'); return; }
    setHidden(true);
    toast.success('Report submitted for review.');
  };

  if (hidden) return null;

  return (
    <>
      <article className={`border-y border-border-default border-l-4 bg-bg-surface px-4 py-4 sm:rounded-lg sm:border ${kindColorClass(post.kind).split(' ')[0]}`}>
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
          <p className={`mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase ${kindColorClass(post.kind).split(' ')[1]}`}>
            <KindIcon className="h-3.5 w-3.5" aria-hidden="true" />{meta.label}
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
          <button type="button" onClick={() => { void toggleSave(); }} aria-label={saved ? 'Remove saved post' : 'Save post'} className={`flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-accent-primary ${saved ? 'text-accent-primary' : ''}`}><Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />Save</button>
          <button type="button" onClick={() => { void hidePost(); }} aria-label="Not interested in this post" className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-score-red"><EyeOff className="h-4 w-4" />Not interested</button>
          <button type="button" onClick={() => { void controlCreator('mute'); }} aria-label="Mute creator" className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-score-red"><VolumeX className="h-4 w-4" />Mute</button>
          <button type="button" onClick={() => { void controlCreator('block'); }} aria-label="Block creator" className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-score-red"><Ban className="h-4 w-4" />Block</button>
          <button type="button" onClick={() => { void reportPost(); }} aria-label="Report post" className="flex items-center gap-1.5 text-xs text-text-secondary transition-colors hover:text-score-red"><Flag className="h-4 w-4" />Report</button>
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
