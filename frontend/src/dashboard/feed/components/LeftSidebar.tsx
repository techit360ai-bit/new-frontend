import { Link, useLocation } from "react-router-dom";
import { Compass, Users, FileText, HelpCircle, AlertTriangle, User, TrendingUp, Sparkles, Rss } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedPosts } from "../useFeedPosts";
import { gsisColorClass } from "@/lib/messaging/postKinds";

export function LeftSidebar() {
  const location = useLocation();
  const { profile, user } = useAuth();
  const { posts, loading } = useFeedPosts("global");

  const ownerId = profile?.id || user?.id;
  const ownPosts = posts.filter((post) => post.authorId === ownerId);
  const name = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()
    || profile?.username
    || profile?.email
    || "User";

  const menuItems = [
    { to: "/feed", label: "Global Pulse", icon: Rss },
    { to: "/feed/tribe", label: "Your Tribe", icon: Users },
    { to: "/feed/build-log", label: "Build Logs", icon: FileText },
    { to: "/feed/questions", label: "Questions & Q&A", icon: HelpCircle },
    { to: "/feed/problems", label: "Problem Signals", icon: AlertTriangle },
  ];

  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[260px] overflow-y-auto border-r border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] p-5 backdrop-blur-xl lg:block font-bricolage">
      {/* Profile Card */}
      <div className="mb-6 rounded-2xl border border-black/[0.06] dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.04] p-4 backdrop-blur-md space-y-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Active Profile</span>
          <Link to="/feed/profile/me" className="text-sm font-bold text-slate-900 dark:text-white hover:text-[#20C997] transition-colors block truncate">
            {name}
          </Link>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 capitalize block mt-0.5">
            {profile?.role || "Explorer"} • {profile?.startupStage || "Stage not set"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-black/[0.06] dark:border-white/10 pt-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">GSIS Score</span>
            <span className={`mt-0.5 font-mono text-base font-black ${gsisColorClass(profile?.credibilityScore ?? 0)}`}>
              {profile?.credibilityScore ?? 0}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Your Posts</span>
            <span className="mt-0.5 font-mono text-base font-black text-slate-900 dark:text-white">
              {loading ? "..." : ownPosts.length}
            </span>
          </div>
        </div>
      </div>

      {/* Hangout Menu */}
      <div className="mb-6 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 block mb-2">Hangout Spaces</span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#20C997]" : "text-slate-400 dark:text-slate-500"}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Live Data Note */}
      <div className="border-t border-black/[0.06] dark:border-white/10 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">Live Intelligence</span>
        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          Real-time activity and online presence signals are synchronized across network spaces.
        </p>
      </div>
    </aside>
  );
}
