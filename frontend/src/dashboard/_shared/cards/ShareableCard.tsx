// frontend/src/dashboard/_shared/cards/ShareableCard.tsx
import { Sparkles, Trophy, User, CheckCircle2, ArrowRight, Share2, Shield, Briefcase, Bell } from "lucide-react";

export type CardMode = "celebration" | "intelligence" | "action";

export type CardType =
  | "founder-milestone"
  | "startup-progress"
  | "founder-identity"
  | "collaborator-recognition"
  | "ai-insight"
  | "action-required"
  | "collaboration-opportunity"
  | "investor-opportunity";

export interface ShareableCardData {
  id: string;
  type: CardType;
  mode: CardMode;
  title: string;
  subtitle?: string;
  description: string;
  startupName?: string;
  badgeText?: string;
  metadata?: Record<string, unknown>;
  actionLabel?: string;
  onAction?: () => void;
  onShare?: () => void;
}

export function ShareableCard({ card }: { card: ShareableCardData }) {
  const isCelebration = card.mode === "celebration";
  const isIntelligence = card.mode === "intelligence";

  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-lg relative overflow-hidden ${
        isCelebration
          ? "bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white border-violet-500/30"
          : isIntelligence
            ? "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white border-blue-500/30"
            : "bg-surface-primary text-text-primary border-border-strong"
      }`}
    >
      {/* Background glow accent */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {card.type === "founder-milestone" && <Trophy className="w-5 h-5 text-amber-400" />}
          {card.type === "ai-insight" && <Sparkles className="w-5 h-5 text-blue-400" />}
          {card.type === "founder-identity" && <User className="w-5 h-5 text-violet-400" />}
          {card.type === "collaborator-recognition" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {card.type === "action-required" && <Bell className="w-5 h-5 text-amber-500" />}
          {card.type === "collaboration-opportunity" && <Briefcase className="w-5 h-5 text-violet-600" />}
          {card.type === "investor-opportunity" && <Shield className="w-5 h-5 text-blue-600" />}
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
            {card.badgeText || card.type.replace(/-/g, " ")}
          </span>
        </div>
        {card.onShare && (
          <button
            onClick={card.onShare}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs flex items-center gap-1.5"
            title="Share card"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        )}
      </div>

      {/* Content */}
      <h3 className="text-base font-bold leading-snug mb-1">{card.title}</h3>
      {card.startupName && <p className="text-xs font-semibold opacity-75 mb-2">{card.startupName}</p>}
      <p className={`text-xs leading-relaxed mb-4 ${isCelebration || isIntelligence ? "text-slate-300" : "text-text-secondary"}`}>
        {card.description}
      </p>

      {/* Footer / Action */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10 text-[11px]">
        <span className="opacity-60 italic">Powered by TechIT Network • No Idea Should Be Lost</span>
        {card.actionLabel && card.onAction && (
          <button
            onClick={card.onAction}
            className="flex items-center gap-1 font-semibold text-accent-primary hover:underline"
          >
            {card.actionLabel} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
