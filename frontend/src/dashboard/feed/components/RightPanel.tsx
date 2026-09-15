import { Link } from "react-router-dom";
import { TrendingUp, Users, AlertCircle, Sparkles, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedPosts } from "../useFeedPosts";
import { gsisColorClass } from "@/lib/messaging/postKinds";

export function RightPanel() {
  const { profile, user } = useAuth();
  const { posts, loading, error } = useFeedPosts("global");

  const ownerId = profile?.id || user?.id;
  const ownPosts = posts.filter((post) => post.authorId === ownerId);

  const contributors = [
    ...new Map(
      posts
        .filter((post) => post.authorId !== ownerId)
        .map((post) => [post.authorId, post])
    ).values(),
  ].slice(0, 4);

  const problems = posts.filter((post) => post.kind === "problem").slice(0, 3);

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[320px] overflow-y-auto p-5 xl:block font-bricolage space-y-4">
      {/* Live Activity Card */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 backdrop-blur-xl shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Live Activity Overview</span>
          <Activity className="h-4 w-4 text-[#20C997]" />
        </div>

        <div className="mt-3 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {profile?.startupStage || "Stage not set"}
            </p>
            <p className="text-[11px] capitalize text-slate-500 dark:text-slate-400">{profile?.role || "Role unavailable"}</p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-2xl font-black ${gsisColorClass(profile?.credibilityScore ?? 0)}`}>
              {profile?.credibilityScore ?? 0}
            </p>
            <p className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">GSIS Rank</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/[0.06] dark:border-white/10 pt-3">
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Total Posts</span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{loading ? "..." : ownPosts.length}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Questions</span>
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
              {loading ? "..." : ownPosts.filter((post) => post.kind === "question").length}
            </span>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-rose-500">{error}</p>}
      </section>

      {/* Recent Contributors */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-[#20C997]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Contributors</span>
        </div>

        <div className="space-y-2.5">
          {contributors.map((post) => (
            <Link
              key={post.authorId}
              to={`/feed/profile/${encodeURIComponent(post.authorId)}`}
              className="group flex items-center justify-between rounded-xl border border-transparent p-2 transition-all hover:border-black/[0.06] dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04]"
            >
              <div>
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#20C997]">
                  {post.authorId}
                </p>
                <p className="text-[10px] capitalize text-slate-400 dark:text-slate-500">{post.authorRole}</p>
              </div>
              <span className="text-[10px] font-semibold text-[#20C997]">View</span>
            </Link>
          ))}

          {!loading && contributors.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">No active contributors found yet.</p>
          )}
        </div>
      </section>

      {/* Problem Signals */}
      <section className="rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 backdrop-blur-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Problem Signals</span>
        </div>

        <div className="space-y-3">
          {problems.map((post) => (
            <Link
              key={post.id}
              to={`/feed/problem/${encodeURIComponent(post.id)}`}
              className="block rounded-xl border border-black/[0.04] dark:border-white/5 p-3 transition-colors hover:border-amber-500/30 hover:bg-amber-500/5"
            >
              <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{post.body}</p>
              <span className="mt-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">{post.authorId}</span>
            </Link>
          ))}

          {!loading && problems.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">No problem signals active.</p>
          )}
        </div>
      </section>
    </aside>
  );
}
