import { BadgeCheck, ShieldCheck } from 'lucide-react';

export function IdentityBadges({ verified, subscriber, credibilityScore, compact = false }: { verified?: boolean; subscriber?: boolean; credibilityScore?: number; compact?: boolean }) {
  const score = Math.max(0, Math.min(100, Number(credibilityScore || 0)));
  if (!verified && !subscriber && score <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5" aria-label="TechIT identity signals">
      {verified && <BadgeCheck className="h-4 w-4 text-emerald-400" aria-label="Verified member" role="img" />}
      {subscriber && !compact && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 tracking-wide">Subscriber</span>}
      {score > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5" title="Earned TechIT credibility score">
          <ShieldCheck className="h-3 w-3 text-cyan-400" />{score}
        </span>
      )}
    </span>
  );
}
