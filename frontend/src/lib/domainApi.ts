// frontend/src/lib/domainApi.ts
//
// Authenticated client for BACKEND /api/domain/* canonical app data.

import { ApiError, getAuthToken } from "./api/client";

const env =
  typeof import.meta !== "undefined"
    ? ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {})
    : {};

const DEFAULT_TIMEOUT_MS = Number(env.VITE_API_TIMEOUT_MS ?? "30000") || 30_000;

export const DOMAIN_API_BASE_URL =
  (env.VITE_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

const DOMAIN_PREFIX = "/domain";

function timeoutSignal(init?: RequestInit): AbortSignal {
  return init?.signal ?? AbortSignal.timeout(DEFAULT_TIMEOUT_MS);
}

function domainUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${DOMAIN_API_BASE_URL}${clean.startsWith(DOMAIN_PREFIX) ? "" : DOMAIN_PREFIX}${clean}`;
}

function headers(extra?: HeadersInit): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = getAuthToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return { ...h, ...(extra as Record<string, string>) };
}

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new ApiError(res.status, `${res.status} ${res.statusText}`, data);
  }
  return data as T;
}

export async function domainGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(domainUrl(path), {
    method: "GET",
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function domainPost<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(domainUrl(path), {
    method: "POST",
    ...init,
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function domainPatch<T>(
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(domainUrl(path), {
    method: "PATCH",
    ...init,
    headers: headers(init?.headers),
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}

export async function domainDelete<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(domainUrl(path), {
    method: "DELETE",
    ...init,
    headers: headers(init?.headers),
    signal: timeoutSignal(init),
  });
  return parse<T>(res);
}
