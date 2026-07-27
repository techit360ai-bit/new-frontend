import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  Zap,
  Bell,
  Target,
  ArrowRight,
  Play,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchSessionContext, type SessionContext } from "@/lib/api/context";

// Role-specific theme tokens
const roleThemes = {
  founder: {
    border: "border-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    button: "bg-violet-600 text-white hover:bg-violet-700",
    decayHealthy: "text-emerald-600",
    decayWarning: "text-amber-600",
    decayCritical: "text-red-600",
  },
  collaborator: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-indigo-700",
    accent: "text-amber-600",
    badge: "bg-indigo-100 text-indigo-700",
    button: "bg-indigo-600 text-white hover:bg-indigo-700",
    decayHealthy: "text-emerald-600",
    decayWarning: "text-amber-600",
    decayCritical: "text-red-600",
  },
  investor: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    accent: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 text-white hover:bg-emerald-700",
    decayHealthy: "text-emerald-600",
    decayWarning: "text-amber-600",
    decayCritical: "text-red-600",
  },
  organisation: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    accent: "text-cyan-600",
    badge: "bg-cyan-100 text-cyan-700",
    button: "bg-cyan-600 text-white hover:bg-cyan-700",
    decayHealthy: "text-emerald-600",
    decayWarning: "text-amber-600",
    decayCritical: "text-red-600",
  },
} as const;

type RoleKey = keyof typeof roleThemes;

export function WelcomeBack() {
  const { profile } = useAuth();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const role: RoleKey = (profile?.role as RoleKey) || "founder";
  const theme = roleThemes[role];

  useEffect(() => {
    let alive = true;
    fetchSessionContext()
      .then((data) => {
        if (alive) setContext(data);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !context) return null;

  // If there's nothing meaningful to show, hide the component
  const hasContent =
    context.resume.length > 0 ||
    context.doNow !== null ||
    context.newSinceLeft.length > 0 ||
    context.weeklyPriority !== null ||
    context.awayMessage !== null;

  if (!hasContent) return null;

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} p-5 space-y-4`}>
      {/* Greeting + Away Message */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{context.greeting}</h2>
          {context.awayMessage && (
            <p className="text-sm text-slate-600 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {context.awayMessage}
            </p>
          )}
        </div>
        {context.gsisScore > 0 && (
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold tabular-nums ${theme.text}`}>
              {Math.round(context.gsisScore)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">GSIS</p>
          </div>
        )}
      </div>

      {/* Decay Status (founders primarily, but shown for any role) */}
      {context.decayStatus && (
        <div className="flex items-center gap-2 text-sm">
          {context.decayStatus.level === "healthy" && (
            <CheckCircle2 className={`w-4 h-4 ${theme.decayHealthy}`} />
          )}
          {context.decayStatus.level === "warning" && (
            <AlertTriangle className={`w-4 h-4 ${theme.decayWarning}`} />
          )}
          {context.decayStatus.level === "critical" && (
            <AlertTriangle className={`w-4 h-4 ${theme.decayCritical}`} />
          )}
          <span
            className={
              context.decayStatus.level === "healthy"
                ? theme.decayHealthy
                : context.decayStatus.level === "warning"
                  ? theme.decayWarning
                  : theme.decayCritical
            }
          >
            Momentum decay: {Math.round(context.decayStatus.factor * 100)}%
            {context.decayStatus.message && ` — ${context.decayStatus.message}`}
          </span>
        </div>
      )}

      {/* Resume Section */}
      {context.resume.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Play className="w-3.5 h-3.5 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resume where you left off
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {context.resume.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/60 bg-white/70 p-3 flex items-start gap-3"
              >
                <Briefcase className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accent}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.nextStep}</p>
                </div>
                {item.actionUrl ? (
                  <Link
                    to={item.actionUrl}
                    className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-md ${theme.button} transition-colors`}
                  >
                    {item.cta}
                  </Link>
                ) : (
                  <span className={`shrink-0 text-xs font-medium ${theme.accent}`}>
                    {item.cta}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Do Now Section */}
      {context.doNow && (
        <div className="rounded-lg border border-white/60 bg-white/70 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className={`w-3.5 h-3.5 ${theme.accent}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Do now
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{context.doNow.action}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {context.doNow.reason} · ~{context.doNow.timeEstimate}
                {context.doNow.credits > 0 && ` · +${context.doNow.credits} credits`}
              </p>
            </div>
            <Link
              to={context.doNow.url}
              className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md ${theme.button} transition-colors`}
            >
              Start <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* New Since You Left */}
      {context.newSinceLeft.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Bell className="w-3.5 h-3.5 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              New since you left
            </h3>
          </div>
          <ul className="space-y-1">
            {context.newSinceLeft.slice(0, 5).map((event, idx) => (
              <li key={idx}>
                <Link
                  to={event.url}
                  className="flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900 group"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                  <span className="flex-1 truncate">{event.description}</span>
                  <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* This Week's Priority */}
      {context.weeklyPriority && (
        <div className="rounded-lg border border-white/60 bg-white/70 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className={`w-3.5 h-3.5 ${theme.accent}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              This week's priority
            </h3>
          </div>
          <p className="text-sm font-medium text-slate-900">{context.weeklyPriority.goal}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Deadline: {context.weeklyPriority.deadline} · {context.weeklyPriority.velocityContext}
          </p>
        </div>
      )}
    </div>
  );
}
