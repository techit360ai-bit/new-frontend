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
import { getReturnSummary, type ReturnSummary } from "@/lib/api/discovery";

// Role-specific theme tokens
const roleThemes = {
  founder: {
    border: "border-violet-200",
    bg: "bg-violet-50",
    text: "text-violet-700",
    accent: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    button: "bg-violet-600 text-white hover:bg-violet-700",
    decayHealthy: "text-status-success",
    decayWarning: "text-status-warning",
    decayCritical: "text-status-error",
  },
  collaborator: {
    border: "border-status-warning",
    bg: "bg-status-warning-soft",
    text: "text-brand-accent",
    accent: "text-status-warning",
    badge: "bg-status-info-soft text-brand-accent",
    button: "bg-brand-accent text-white hover:bg-brand-accent",
    decayHealthy: "text-status-success",
    decayWarning: "text-status-warning",
    decayCritical: "text-status-error",
  },
  investor: {
    border: "border-status-success",
    bg: "bg-status-success-soft",
    text: "text-status-success",
    accent: "text-status-success",
    badge: "bg-status-success-soft text-status-success",
    button: "bg-status-success text-white hover:bg-status-success",
    decayHealthy: "text-status-success",
    decayWarning: "text-status-warning",
    decayCritical: "text-status-error",
  },
  organisation: {
    border: "border-cyan-200",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
    accent: "text-cyan-600",
    badge: "bg-cyan-100 text-cyan-700",
    button: "bg-cyan-600 text-white hover:bg-cyan-700",
    decayHealthy: "text-status-success",
    decayWarning: "text-status-warning",
    decayCritical: "text-status-error",
  },
} as const;

type RoleKey = keyof typeof roleThemes;

export function WelcomeBack() {
  const { profile } = useAuth();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnSummary, setReturnSummary] = useState<ReturnSummary | null>(null);
  const role: RoleKey = (profile?.role as RoleKey) || "founder";
  const theme = roleThemes[role];

  useEffect(() => {
    let alive = true;
    Promise.allSettled([fetchSessionContext(), getReturnSummary()])
      .then(([contextResult, returnResult]) => {
        if (!alive) return;
        if (contextResult.status === 'fulfilled') setContext(contextResult.value);
        if (returnResult.status === 'fulfilled') setReturnSummary(returnResult.value);
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

  const hasReturnSummary = Boolean(returnSummary?.available && returnSummary.items.length > 0);

  if (!hasContent && !hasReturnSummary) return null;

  return (
    <div className={`rounded-xl border ${theme.border} ${theme.bg} p-5 space-y-4`}>
      {/* Greeting + Away Message */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">{context.greeting}</h2>
          {context.awayMessage && (
            <p className="text-sm text-text-muted mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-text-disabled" />
              {context.awayMessage}
            </p>
          )}
        </div>
        {context.gsisScore > 0 && (
          <div className="text-right shrink-0">
            <p className={`text-2xl font-bold tabular-nums ${theme.text}`}>
              {Math.round(context.gsisScore)}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-text-muted">GSIS</p>
          </div>
        )}
      </div>

      {hasReturnSummary && returnSummary && (
        <div className="rounded-lg border border-white/60 bg-surface-primary/70 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <Bell className={`h-3.5 w-3.5 ${theme.accent}`} />
                <h3 className="text-xs font-semibold uppercase text-text-muted">Return intelligence</h3>
              </div>
              <p className="mt-1 text-sm font-medium text-text-primary">{returnSummary.headline}</p>
              <p className="mt-1 text-xs text-text-muted">{returnSummary.categories.map(item => `${item.count} ${item.name.toLowerCase()}`).join(' · ')}</p>
            </div>
            <Link to="/feed?catchup=1" className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium ${theme.button}`}>
              Catch up <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

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
            <Play className="w-3.5 h-3.5 text-text-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Resume where you left off
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {context.resume.map((item, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-white/60 bg-surface-primary/70 p-3 flex items-start gap-3"
              >
                <Briefcase className={`w-4 h-4 mt-0.5 shrink-0 ${theme.accent}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{item.nextStep}</p>
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
        <div className="rounded-lg border border-white/60 bg-surface-primary/70 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className={`w-3.5 h-3.5 ${theme.accent}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Do now
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{context.doNow.action}</p>
              <p className="text-xs text-text-muted mt-0.5">
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
            <Bell className="w-3.5 h-3.5 text-text-muted" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              New since you left
            </h3>
          </div>
          <ul className="space-y-1">
            {context.newSinceLeft.slice(0, 5).map((event, idx) => (
              <li key={idx}>
                <Link
                  to={event.url}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary group"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-text-disabled group-hover:text-text-muted shrink-0" />
                  <span className="flex-1 truncate">{event.description}</span>
                  <ArrowRight className="w-3 h-3 text-text-on-inverse-secondary group-hover:text-text-muted shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* This Week's Priority */}
      {context.weeklyPriority && (
        <div className="rounded-lg border border-white/60 bg-surface-primary/70 p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className={`w-3.5 h-3.5 ${theme.accent}`} />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              This week's priority
            </h3>
          </div>
          <p className="text-sm font-medium text-text-primary">{context.weeklyPriority.goal}</p>
          <p className="text-xs text-text-muted mt-0.5">
            Deadline: {context.weeklyPriority.deadline} · {context.weeklyPriority.velocityContext}
          </p>
        </div>
      )}
    </div>
  );
}
