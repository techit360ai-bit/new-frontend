import { Heart, MessageCircle, Share2, Eye } from "lucide-react";

interface PostProps {
  post: {
    id: string;
    author: {
      name: string;
      role: string;
      avatar: string;
      initials: string;
      avatarColor: string;
    };
    timestamp: string;
    gsis: number;
    milestone?: string;
    type: "milestone" | "insight" | "problem" | "question" | "collab-call";
    title: string;
    description: string;
    tags?: string[];
    stats?: {
      label: string;
      value: string | number;
      color?: string;
    }[];
    engagement: {
      likes: number;
      comments: number;
      views?: number;
    };
    actions?: {
      label: string;
      href: string;
      color?: string;
    }[];
    lookingFor?: string;
    skillsNeeded?: string[];
    matchScore?: number;
    borderColor?: string;
  };
}

const FeedPost = ({ post }: PostProps) => {
  const getBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      milestone: "bg-[#20c937]/15 text-[#20c937]",
      insight: "bg-[#0066ff]/15 text-[#0066ff] dark:text-[#58a6ff]",
      problem: "bg-red-500/15 text-red-500 dark:text-red-400",
      question: "bg-[#58a6ff]/15 text-[#0066ff] dark:text-[#58a6ff]",
      "collab-call": "bg-[#58a6ff]/15 text-[#0066ff] dark:text-[#58a6ff]",
    };
    return colors[type] || "bg-slate-500/15 text-slate-600 dark:text-slate-300";
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      milestone: "MILESTONE HIT",
      insight: "INSIGHT",
      problem: "AI DISCOVERED",
      question: "QUESTION",
      "collab-call": "COLLAB CALL",
    };
    return labels[type] || "";
  };

  return (
    <div
      className={`bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl border border-black/[0.06] dark:border-white/10 rounded-2xl p-5 space-y-4 hover:border-black/10 dark:hover:border-white/20 transition-all shadow-sm ${
        post.borderColor || ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${post.author.avatarColor} shrink-0 flex items-center justify-center font-bold text-white text-lg shadow-sm`}
          />

          {/* Author Info */}
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {post.author.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {post.author.role}
            </p>
          </div>
        </div>

        {/* GSIS Badge */}
        {post.gsis > 0 && (
          <div className="shrink-0 px-3 py-1 bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/10 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              GSIS {post.gsis}
            </span>
          </div>
        )}
      </div>

      {/* Type Badge & Timestamp */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {post.milestone && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${getBadgeColor(post.type)}`}
            >
              {getTypeLabel(post.type)}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">{post.timestamp}</span>
      </div>

      {/* Title/Main Content */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
          {post.title}
        </h3>

        {/* Looking for (Collab Call) */}
        {post.lookingFor && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">Looking for:</p>
            <div className="inline-block px-3 py-1.5 border border-[#0066ff]/30 dark:border-[#58a6ff]/30 rounded-full text-sm text-[#0066ff] dark:text-[#58a6ff]">
              {post.lookingFor}
            </div>

            {post.skillsNeeded && (
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Skills needed:</p>
                <div className="flex gap-2 flex-wrap">
                  {post.skillsNeeded.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 rounded-lg"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {post.matchScore && (
              <div className="pt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Your match:</p>
                <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0066ff] to-[#20c937]"
                    style={{ width: `${post.matchScore}%` }}
                  />
                </div>
                <p className="text-xs text-[#20c937] font-semibold mt-1">
                  {post.matchScore}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2">
          {post.tags.map((tag, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1 rounded-lg ${
                tag.startsWith("+")
                  ? "text-[#20c937] bg-[#20c937]/10"
                  : "text-slate-600 dark:text-slate-400 bg-black/[0.04] dark:bg-white/[0.06]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {post.stats && post.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-black/[0.06] dark:border-white/10">
          {post.stats.map((stat, i) => (
            <div key={i}>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color || "text-slate-900 dark:text-white"}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {post.actions && post.actions.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          {post.actions.map((action, i) => (
            <a
              key={i}
              href={action.href}
              className={`text-sm font-medium text-center py-2 px-4 rounded-xl transition-all ${
                action.color
                  ? action.color.includes("purple") || action.color.includes("blue")
                    ? "bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white font-bold shadow-[0_4px_15px_rgba(0,102,255,0.25)]"
                    : action.color
                  : "text-[#0066ff] dark:text-[#58a6ff] hover:underline"
              }`}
            >
              {action.label}
            </a>
          ))}
        </div>
      )}

      {/* Footer - Engagement Metrics */}
      <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/10 text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4 text-xs">
          <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
            <Heart className="w-4 h-4" />
            <span>{post.engagement.likes}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-[#0066ff] dark:hover:text-[#58a6ff] transition-colors">
            <MessageCircle className="w-4 h-4" />
            <span>{post.engagement.comments} comments</span>
          </button>
          {post.engagement.views && (
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.engagement.views}</span>
            </div>
          )}
        </div>
        <button className="hover:text-slate-900 dark:hover:text-white transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeedPost;
