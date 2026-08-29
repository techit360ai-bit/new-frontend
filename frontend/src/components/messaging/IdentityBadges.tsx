import { BadgeCheck, ShieldCheck } from 'lucide-react';

export function IdentityBadges({ verified, subscriber, credibilityScore, compact = false }: { verified?: boolean; subscriber?: boolean; credibilityScore?: number; compact?: boolean }) {
  const score = Math.max(0, Math.min(100, Number(credibilityScore || 0)));
  if (!verified && !subscriber && score <= 0) return null;
  return (
    <span className="inline-flex shrink-0 items-center gap-1" aria-label="TechIT identity signals">
      {verified && <BadgeCheck className="h-3.5 w-3.5 text-sky-600" aria-label="Verified member" role="img" />}
      {subscriber && !compact && <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Subscriber</span>}
      {score > 0 && (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-text-muted" title="Earned TechIT credibility score">
          <ShieldCheck className="h-3 w-3" />{score}
        </span>
      )}
    </span>
  );
}
