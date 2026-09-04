import { isNetworkFailure, observeRequest } from './connectivity';

const delays = [200, 600];

function wait(ms: number): Promise<void> {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') return Promise.resolve();
  return new Promise(resolve => globalThis.setTimeout(resolve, ms));
}

export async function fetchIdempotent(run: () => Promise<Response>): Promise<Response> {
  const started = Date.now();
  let lastError: unknown;
  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      const response = await run();
      if (response.ok || (response.status < 500 && response.status !== 429)) {
        observeRequest({ ok: response.ok, latencyMs: Date.now() - started });
        return response;
      }
      lastError = new Error(`Temporary service failure (${response.status})`);
    } catch (error) {
      if (!isNetworkFailure(error) || attempt === delays.length) {
        observeRequest({ ok: false, latencyMs: Date.now() - started });
        throw error;
      }
      lastError = error;
    }
    if (attempt < delays.length) await wait(delays[attempt]);
  }
  observeRequest({ ok: false, latencyMs: Date.now() - started });
  throw lastError instanceof Error ? lastError : new Error('Request failed');
}
