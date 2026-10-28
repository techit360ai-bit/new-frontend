import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { ReturnSummary } from '@/lib/api/discovery'

export function ReturnSummaryBanner({ summary, onStart }: { summary: ReturnSummary; onStart: () => void }) {
  return (
    <section className="border-y border-border-default bg-bg-surface px-4 py-5 sm:border sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-accent-primary">Welcome back</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">{summary.headline}</h2>
          <p className="mt-1 text-sm text-text-secondary">{summary.message}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
            {summary.categories.map(category => <span key={category.name}>{category.count} {category.name.toLowerCase()}</span>)}
          </div>
        </div>
        <button type="button" onClick={onStart} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-accent-primary px-4 text-sm font-semibold text-white hover:opacity-90">
          Catch up <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

export function CaughtUpNotice() {
  return (
    <div className="flex items-center gap-3 border-y border-border-default bg-bg-surface px-4 py-4 text-sm sm:border">
      <CheckCircle2 className="h-5 w-5 text-score-green" />
      <div>
        <p className="font-semibold text-text-primary">You're all caught up.</p>
        <p className="text-text-secondary">Recommended for you continues below.</p>
      </div>
    </div>
  )
}
