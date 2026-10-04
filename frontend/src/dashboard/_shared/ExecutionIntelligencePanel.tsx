import { Activity, BadgeCheck, Boxes, Gauge, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useExecutionIntelligence } from '@/hooks/useExecutionIntelligence';
import type { ExecutionIntelligenceRole } from '@/lib/api/executionIntelligence';

interface Props {
  /** Which consumer surface this is. The server shapes `roleFocus` accordingly. */
  role: ExecutionIntelligenceRole;
  actorId?: string;
  projectId?: string;
  organizationId?: string;
  hackathonId?: string;
  title?: string;
  className?: string;
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-primary px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-text-muted">{icon}{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

/**
 * One canonical execution-intelligence reading, reused by every surface
 * (founder, collaborator, investor, organization, hackathon). It renders the
 * server projection directly; it never computes a score or trust of its own.
 */
export function ExecutionIntelligencePanel({
  role,
  actorId,
  projectId,
  organizationId,
  hackathonId,
  title = 'Execution intelligence',
  className = '',
}: Props) {
  const { view, loading, error } = useExecutionIntelligence({ role, actorId, projectId, organizationId, hackathonId });

  return (
    <section className={`rounded-xl border border-border-default bg-surface-primary p-5 ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-primary" />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <Badge variant="outline" className="text-xs">{role}</Badge>
      </div>

      {loading && <p className="text-sm text-text-muted">Loading execution intelligence…</p>}
      {!loading && (error || !view?.ok) && (
        <p className="text-sm text-text-muted">Execution intelligence is unavailable for this scope.</p>
      )}

      {!loading && view?.ok && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={<Activity className="h-3.5 w-3.5" />} label="Events" value={String(view.signals.events)} />
            <Stat icon={<Users className="h-3.5 w-3.5" />} label="Active actors" value={String(view.signals.activeActors)} />
            <Stat icon={<Boxes className="h-3.5 w-3.5" />} label="Artifacts" value={String(view.signals.artifacts)} />
            <Stat icon={<Gauge className="h-3.5 w-3.5" />} label="Events / day" value={view.velocity.eventsPerDay.toFixed(1)} />
          </div>

          {view.highlights.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {view.highlights.slice(0, 5).map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-text-secondary">{item.summary}</span>
                  <span className="shrink-0 text-xs text-text-disabled">{new Date(item.at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}

          {view.trust.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {view.trust.slice(0, 6).map((row) => (
                <Badge key={row.subjectId} variant="secondary" className="text-xs">
                  <BadgeCheck className="mr-1 h-3 w-3" />{row.subjectId}
                </Badge>
              ))}
            </div>
          )}

          <p className="mt-3 text-xs text-text-disabled">
            Canonical view · execution from the workspace, trust from the Trust Engine.
          </p>
        </>
      )}
    </section>
  );
}
