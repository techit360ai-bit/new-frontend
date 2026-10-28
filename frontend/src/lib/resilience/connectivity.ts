export type ConnectivityState = 'online' | 'degraded' | 'offline';

let lastLatency = 0;
let lastFailure = 0;

export function observeRequest(result: { ok: boolean; latencyMs: number }): void {
  lastLatency = result.latencyMs;
  if (!result.ok) lastFailure = Date.now();
}

export function currentConnectivity(): ConnectivityState {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
  if (lastLatency > 2500 || (lastFailure > 0 && Date.now() - lastFailure < 15000)) return 'degraded';
  return 'online';
}

export function isNetworkFailure(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true;
  const domException = typeof DOMException !== 'undefined' && error instanceof DOMException;
  return error instanceof TypeError || (domException && ['AbortError', 'TimeoutError', 'NetworkError'].includes((error as DOMException).name));
}
