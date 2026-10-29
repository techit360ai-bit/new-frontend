export type ConnectivityState = 'online' | 'degraded' | 'offline';

/**
 * Why a request failed. Only `offline` means the device has no network; a
 * device that is online but cannot reach the service is `unreachable`
 * (server down, DNS failure, or a CORS-blocked response all surface in the
 * browser as `TypeError: Failed to fetch`).
 */
export type FailureKind =
  | 'offline'
  | 'unreachable'
  | 'timeout'
  | 'server'
  | 'auth'
  | 'client'
  | 'unknown';

let lastLatency = 0;
let lastFailure = 0;

export function observeRequest(result: { ok: boolean; latencyMs: number }): void {
  lastLatency = result.latencyMs;
  if (!result.ok) lastFailure = Date.now();
}

export function currentConnectivity(): ConnectivityState {
  if (isOffline()) return 'offline';
  if (lastLatency > 2500 || (lastFailure > 0 && Date.now() - lastFailure < 15000)) return 'degraded';
  return 'online';
}

export function isOffline(): boolean {
  // `onLine` can be undefined in non-browser runtimes/tests; only an explicit
  // `false` means offline, so a missing value is treated as online.
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function errorName(error: unknown): string {
  if (typeof error !== 'object' || error === null) return '';
  return String((error as { name?: unknown }).name ?? '');
}

export function classifyFailure(error: unknown): FailureKind {
  // A device with no network can never distinguish "server down" from
  // "offline", so navigator.onLine wins when it is definitively false.
  if (isOffline()) return 'offline';

  if (typeof error === 'object' && error !== null) {
    const status = Number((error as { status?: unknown }).status);
    if (Number.isFinite(status)) {
      if (status === 401 || status === 403) return 'auth';
      if (status >= 500) return 'server';
      if (status >= 400) return 'client';
    }
  }

  const name = errorName(error);
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout';
  if (name === 'NetworkError') return 'unreachable';
  if (error instanceof TypeError) return 'unreachable';
  return 'unknown';
}

/**
 * Retryable transport failure. Intentionally excludes 4xx/5xx: callers that
 * queue writes (posts, comments) must only do so when the request never
 * reached the service, so a server rejection is surfaced instead of retried.
 */
export function isNetworkFailure(error: unknown): boolean {
  const kind = classifyFailure(error);
  return kind === 'offline' || kind === 'unreachable' || kind === 'timeout';
}

/** User-facing copy that never claims "offline" when the device is online. */
export function failureMessage(
  error: unknown,
  context: 'feed' | 'incubation' | 'messaging' | 'generic' = 'generic',
): string {
  const kind = classifyFailure(error);
  switch (kind) {
    case 'offline':
      return context === 'feed'
        ? "You're offline and no saved posts are available yet."
        : "You're offline. Reconnect to continue.";
    case 'timeout':
      return 'The service took too long to respond. Please try again.';
    case 'server':
      return 'The service is temporarily unavailable. Please try again shortly.';
    case 'unreachable':
      if (context === 'feed') return "We couldn't reach the live feed. Check your connection and try again.";
      if (context === 'incubation') return "We couldn't reach the analysis service, so your idea wasn't submitted. Please try again.";
      return "We couldn't reach the service. Please try again.";
    case 'auth':
      return 'Your session has expired. Please sign in again.';
    case 'client':
      return error instanceof Error && error.message ? error.message : 'That request was rejected. Please check your input.';
    default:
      return error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
  }
}
