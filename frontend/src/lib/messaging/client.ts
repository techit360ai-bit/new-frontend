import {
  env,
  messagingUrl,
  messagingToken,
  messagingFallbackEnabled,
} from "./config";
import { fetchIdempotent } from '@/lib/resilience/retry';

// See lib/api/client.ts for the rationale — raw fetch has no timeout, and a
// hung Go messaging service would otherwise lock UI surfaces indefinitely.
// 15s is tighter than the ai-router default because messaging endpoints are
// CRUD-only (no agent / LLM step). Override with VITE_MESSAGING_TIMEOUT_MS.
const DEFAULT_TIMEOUT_MS = Number(
  env.VITE_MESSAGING_TIMEOUT_MS ?? "15000",
) || 15_000;

function timeoutSignal(init?: RequestInit): AbortSignal {
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  try { if (typeof localStorage !== 'undefined' && localStorage.getItem('techit-data-saver') === '1') h['X-TechIT-Data-Saver'] = '1'; } catch { /* storage unavailable */ }
  const t = messagingToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  let body: { error?: string; message?: string } | null = null;
  if (typeof (res as Response & { text?: unknown }).text === "function") {
    const text = await res.text();
    body = text ? JSON.parse(text) as { error?: string; message?: string } : null;
  } else if (typeof (res as Response & { json?: unknown }).json === "function") {
    body = await res.json() as { error?: string; message?: string };
  }
  if (!res.ok) throw new Error(body?.message || body?.error || `messaging ${res.status}`);
  return body as T;
}

export async function msgGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchIdempotent(() => fetch(messagingUrl(path), {
    method: "GET",
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  }));
  return parse<T>(res);
}

export async function msgPost<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "POST",
    ...init,
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function msgPut<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), { method: "PUT", ...init, headers: headers(init?.headers), body: body === undefined ? undefined : JSON.stringify(body), signal: timeoutSignal(init) });
  return parse<T>(res);
}

export async function msgPatch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "PATCH",
    ...init,
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function msgDelete<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(messagingUrl(path), {
    method: "DELETE",
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

// Mirrors lib/api/client.ts withFallback so screens stay offline-safe.
export async function withFallback<T>(call: () => Promise<T>, fallback: T | (() => T), label?: string): Promise<T> {
  try {
    return await call();
  } catch (err) {
    if (!messagingFallbackEnabled()) throw err;
    if (typeof console !== "undefined") {
      const isTimeout = err instanceof DOMException && err.name === "TimeoutError";
      const tag = isTimeout ? "[msg timeout]" : "[msg]";
      console.warn(`${tag} ${label ?? "request"} failed; using fallback`, err);
    }
    return typeof fallback === "function" ? (fallback as () => T)() : fallback;
  }
}
