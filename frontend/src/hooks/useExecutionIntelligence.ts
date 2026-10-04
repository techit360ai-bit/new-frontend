import { useEffect, useState } from 'react';
import {
  fetchExecutionIntelligence,
  type ExecutionIntelligenceQuery,
  type ExecutionIntelligenceView,
} from '@/lib/api/executionIntelligence';

/**
 * Read the canonical execution-intelligence view for a role/scope. Every
 * surface (founder, collaborator, investor, organization, hackathon) uses this
 * same hook so none of them grows its own intelligence formula.
 */
export function useExecutionIntelligence(query: ExecutionIntelligenceQuery) {
  const [view, setView] = useState<ExecutionIntelligenceView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(query ?? {});

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchExecutionIntelligence(query)
      .then((data) => {
        if (!alive) return;
        setView(data);
        setError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setView(null);
        setError(err instanceof Error ? err.message : 'Execution intelligence is unavailable.');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { view, error, loading };
}
