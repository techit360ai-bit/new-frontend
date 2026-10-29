import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import { fetchExecutionIntelligence, type ExecutionIntelligenceQuery, type ExecutionIntelligenceView } from '@/lib/api/executionIntelligence';

interface Reading {
  key: string;
  view: ExecutionIntelligenceView | null;
  error: string | null;
  status?: number;
}

/** Reads the server projection; never computes a client-side score. */
export function useExecutionIntelligence(query: ExecutionIntelligenceQuery) {
  const [revision, setRevision] = useState(0);
  const [reading, setReading] = useState<Reading | null>(null);
  const key = JSON.stringify([query, revision]);
  const retry = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const controller = new AbortController();
    fetchExecutionIntelligence(query, { signal: controller.signal })
      .then(view => {
        if (!controller.signal.aborted) setReading({ key, view, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setReading({
          key, view: null,
          error: error instanceof Error ? error.message : 'Execution intelligence is unavailable.',
          status: error instanceof ApiError ? error.status : undefined,
        });
      });
    return () => controller.abort();
    // The key includes every scope field and the retry revision.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  // A previous role or venture's reading must never appear in the new scope.
  const current = reading?.key === key ? reading : null;
  return { view: current?.view ?? null, error: current?.error ?? null, status: current?.status, loading: current === null, retry };
}
