import { Link } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Building2,
  FileText,
  Info,
  Lightbulb,
  Rocket,
  UserRound,
  X,
} from 'lucide-react'
import type { DiscoveryRecommendation, RecommendationEntityType } from '@/lib/api/discovery'

const ICONS: Record<RecommendationEntityType, typeof UserRound> = {
  person: UserRound,
  startup: Rocket,
  project: BriefcaseBusiness,
  opportunity: BriefcaseBusiness,
  idea: Lightbulb,
  organization: Building2,
  content: FileText,
  notification: UserRound,
}

export function RecommendationCard({
  recommendation,
  onDismiss,
  onAction,
}: {
  recommendation: DiscoveryRecommendation
  onDismiss?: (recommendation: DiscoveryRecommendation) => void
  onAction?: (recommendation: DiscoveryRecommendation, actionId: string) => void
}) {
  const Icon = ICONS[recommendation.entityType] || Lightbulb
  const primary = recommendation.entity.actions?.[0]

  return (
    <article className="flex min-h-[196px] flex-col border border-border-default bg-surface-primary p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-secondary text-accent-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase text-text-muted">{recommendation.entityType}</p>
          <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{recommendation.entity.title}</h3>
          {recommendation.entity.subtitle && <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{recommendation.entity.subtitle}</p>}
        </div>
        {onDismiss && (
          <button type="button" onClick={() => onDismiss(recommendation)} className="rounded-md p-1 text-text-muted hover:bg-surface-secondary hover:text-text-primary" aria-label="Hide recommendation">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-3 flex gap-2 text-xs text-text-secondary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-primary" />
        <p className="line-clamp-3">{recommendation.reasonText}</p>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-4">
        {primary && (
          <Link
            to={primary.href}
            onClick={() => onAction?.(recommendation, primary.id)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-accent-primary px-3 text-xs font-semibold text-white hover:opacity-90"
          >
            {primary.label}
          </Link>
        )}
        {recommendation.entity.actions?.[1] && (
          <Link
            to={recommendation.entity.actions[1].href}
            onClick={() => onAction?.(recommendation, recommendation.entity.actions[1].id)}
            className="inline-flex h-9 items-center justify-center rounded-md border border-border-default px-3 text-xs font-semibold text-text-primary hover:bg-surface-secondary"
          >
            {recommendation.entity.actions[1].label}
          </Link>
        )}
      </div>
    </article>
  )
}
