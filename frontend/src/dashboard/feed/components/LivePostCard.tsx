import { useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Bookmark, EyeOff, Flag, Flame, MessageCircle, Share2, Tag, VolumeX, MoreHorizontal, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { likePost, unlikePost } from "@/lib/messaging/feed";
import { KIND_META, kindColorClass } from "@/lib/messaging/postKinds";
import type { WirePost } from "@/lib/messaging/types";
import { ShareModal } from "./ShareModal";
import { blockUser, muteUser, postFeedback, savePost, unsavePost } from "@/lib/messaging/discovery";

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || "Just now";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function kindMeta(kind: string): { label: string; icon: LucideIcon } {
  return KIND_META[kind] ?? {
    label: kind.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    icon: Tag,
  };
}

function initials(value: string): string {
  return value
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";
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
  const [menuOpen, setMenuOpen] = useState(false);

  const meta = kindMeta(post.kind);
  const KindIcon = meta.icon;
  const author = authorName || post.authorId;

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const result = liked ? await unlikePost(post.id) : await likePost(post.id);
      if (!result) throw new Error("Reaction endpoint did not return a persisted count.");
      setLiked((current) => !current);
      setLikeCount(result.likeCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reaction could not be saved.");
    } finally {
      setLiking(false);
    }
  };

  const toggleSave = async () => {
    const result = saved ? await unsavePost(post.id) : await savePost(post.id);
    if (!result) { toast.error("Save could not be persisted."); return; }
    setSaved(result.saved);
    toast.success(result.saved ? "Post saved to bookmarks" : "Post removed from bookmarks");
  };

  const hidePost = async () => {
    setMenuOpen(false);
    const result = await postFeedback(post.id, "not_interested");
    if (!result) { toast.error("Feedback could not be persisted."); return; }
    setHidden(true);
  };

  const controlCreator = async (control: "mute" | "block") => {
    setMenuOpen(false);
    const result = control === "mute" ? await muteUser(post.authorId) : await blockUser(post.authorId);
    if (!result) { toast.error(`${control} could not be persisted.`); return; }
    setHidden(true);
    toast.success(control === "mute" ? "Creator muted." : "Creator blocked.");
  };

  const reportPost = async () => {
    setMenuOpen(false);
    const result = await postFeedback(post.id, "report");
    if (!result) { toast.error("Report could not be persisted."); return; }
    setHidden(true);
    toast.success("Report submitted for review.");
  };

  if (hidden) return null;

  return (
    <>
      <article className="group relative flex flex-col justify-between rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#121212]/90 p-5 backdrop-blur-xl shadow-sm transition-all duration-300 hover:border-[#0066ff]/30 dark:hover:border-white/20 font-bricolage">
        {/* Post Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <Link to={`/feed/profile/${encodeURIComponent(post.authorId)}`} className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0066ff] to-[#58a6ff] text-xs font-black text-white shadow-md">
              {initials(author)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#0066ff] dark:group-hover:text-[#58a6ff] transition-colors">
                  {author}
                </span>
                <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0066ff] dark:text-[#58a6ff] border border-blue-200 dark:border-blue-800 px-2 py-0.2 text-[9px] font-bold capitalize">
                  {post.authorRole || "Member"}
                </span>
              </div>
              <time className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5" dateTime={post.ts}>
                {formatTimestamp(post.ts)}
              </time>
            </div>
          </Link>

          {/* More Actions Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-[#18181b]/95 text-xs">
                  <button
                    type="button"
                    onClick={() => void hidePost()}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Not Interested</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void controlCreator("mute")}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10 rounded-lg"
                  >
                    <VolumeX className="h-3.5 w-3.5" />
                    <span>Mute Creator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void controlCreator("block")}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg"
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Block Creator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void reportPost()}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 rounded-lg border-t border-black/[0.04] dark:border-white/5 mt-1 pt-1.5"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Report Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Kind Badge & Content */}
        <Link to={`/feed/post/${encodeURIComponent(post.id)}`} className="block">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-bold text-[#0066ff] dark:text-[#58a6ff]">
            <KindIcon className="h-3 w-3" aria-hidden="true" />
            <span>{meta.label}</span>
          </div>
          <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200">
            {post.body}
          </p>
        </Link>

        {(post.audience ?? []).length > 0 && !(post.audience ?? []).includes("all") && (
          <p className="mt-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500">
            Targeted for: {(post.audience ?? []).join(", ")}
          </p>
        )}

        {/* Action Bar */}
        <div className="mt-4 flex items-center justify-between border-t border-black/[0.06] dark:border-white/10 pt-3 text-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { void toggleLike(); }}
              disabled={liking}
              aria-label={liked ? "Remove reaction" : "React to post"}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                liked ? "text-rose-500" : "text-slate-500 dark:text-slate-400 hover:text-rose-500"
              }`}
            >
              <Flame className={`h-4 w-4 ${liked ? "fill-current text-rose-500" : ""}`} />
              <span>{likeCount === null ? "React" : likeCount}</span>
            </button>

            <Link
              to={`/feed/post/${encodeURIComponent(post.id)}`}
              className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Comment</span>
            </Link>

            <button
              type="button"
              onClick={() => { void toggleSave(); }}
              aria-label={saved ? "Remove saved post" : "Save post"}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                saved ? "text-[#0066ff] dark:text-[#58a6ff]" : "text-slate-500 dark:text-slate-400 hover:text-[#0066ff]"
              }`}
            >
              <Bookmark className={`h-4 w-4 ${saved ? "fill-current" : ""}`} />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShareOpen(true)}
            aria-label="Share post"
            className="flex items-center gap-1.5 font-bold text-slate-500 dark:text-slate-400 hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Share</span>
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
