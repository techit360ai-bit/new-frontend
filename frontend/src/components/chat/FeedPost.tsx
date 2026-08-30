import { Heart, MessageCircle, Share2, Eye, Sparkles } from "lucide-react";

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
      milestone: "bg-status-success/20 text-status-success",
      insight: "bg-status-info/20 text-status-info",
      problem: "bg-status-error/20 text-status-error",
      question: "bg-status-pending/20 text-status-pending",
      "collab-call": "bg-status-pending/20 text-status-pending",
    };
    return colors[type] || "bg-status-inactive/20 text-text-on-inverse-secondary";
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
      className={`bg-background-inverse border border-border-inverse rounded-xl p-5 space-y-4 hover:border-border-inverse-strong transition-colors ${
        post.borderColor || ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3 min-w-0">
          {/* Avatar */}
          <div
            className={`w-12 h-12 rounded-full bg-linear-to-br ${post.author.avatarColor} shrink-0 flex items-center justify-center font-bold text-white text-lg`}
          />

          {/* Author Info */}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {post.author.name}
            </p>
            <p className="text-xs text-text-disabled truncate">
              {post.author.role}
            </p>
          </div>
        </div>

        {/* GSIS Badge */}
        {post.gsis > 0 && (
          <div className="shrink-0 px-3 py-1 bg-surface-inverse-muted border border-border-inverse-strong rounded-lg">
            <span className="text-xs font-semibold text-text-on-inverse-secondary">
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
              className={`text-xs font-bold px-2 py-1 rounded ${getBadgeColor(post.type)}`}
            >
              {getTypeLabel(post.type)}
            </span>
          )}
        </div>
        <span className="text-xs text-text-muted">{post.timestamp}</span>
      </div>

      {/* Title/Main Content */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-white leading-snug">
          {post.title}
        </h3>

        {/* Looking for (Collab Call) */}
        {post.lookingFor && (
          <div className="space-y-2 pt-2">
            <p className="text-sm text-text-disabled">Looking for:</p>
            <div className="inline-block px-3 py-1.5 border border-status-pending/30 rounded-full text-sm text-status-pending">
              {post.lookingFor}
            </div>

            {post.skillsNeeded && (
              <div>
                <p className="text-sm text-text-disabled mb-2">Skills needed:</p>
                <div className="flex gap-2 flex-wrap">
                  {post.skillsNeeded.map((skill, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-surface-inverse-muted text-text-on-inverse-secondary rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {post.matchScore && (
              <div className="pt-2">
                <p className="text-sm text-text-disabled mb-2">Your match:</p>
                <div className="w-full h-1.5 bg-surface-inverse-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-linear-to-r from-green-500 to-emerald-500"
                    style={{ width: `${post.matchScore}%` }}
                  />
                </div>
                <p className="text-xs text-status-success font-semibold mt-1">
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
              className={`text-xs px-2 py-1 rounded ${
                tag.startsWith("+")
                  ? "text-status-success"
                  : "text-text-disabled bg-surface-inverse-muted/50"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {post.stats && post.stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border-inverse">
          {post.stats.map((stat, i) => (
            <div key={i}>
              <p className="text-xs text-text-muted">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color || "text-white"}`}>
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
              className={`text-sm font-medium text-center py-2 px-4 rounded-lg transition-colors ${
                action.color
                  ? action.color === "bg-status-pending"
                    ? "bg-status-pending hover:bg-status-pending text-white font-semibold"
                    : action.color
                  : "text-status-info hover:text-status-info"
              }`}
            >
              {action.label}
            </a>
          ))}
        </div>
      )}

      {/* Footer - Engagement Metrics */}
      <div className="flex items-center justify-between pt-3 border-t border-border-inverse text-text-disabled">
        <div className="flex items-center gap-4 text-xs">
          <button className="flex items-center gap-1 hover:text-status-error transition-colors">
            <Heart className="w-4 h-4" />
            <span>{post.engagement.likes}</span>
          </button>
          <button className="flex items-center gap-1 hover:text-status-info transition-colors">
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
        <button className="hover:text-text-on-inverse-secondary transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FeedPost;
