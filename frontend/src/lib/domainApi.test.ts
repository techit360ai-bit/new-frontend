import { expect, test } from "vitest";
import { ApiError, setAuthTokenGetter } from "./api/client";
import { domainGet, domainPatch, domainPost } from "./domainApi";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return handler(String(url), init);
  }) as typeof fetch;

  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

test("domainGet builds BACKEND /api/domain URLs and forwards bearer auth", async () => {
  setAuthTokenGetter(() => "jwt-domain");
  const fetchMock = stubFetch(async () => response({ projects: [] }));

  try {
    const data = await domainGet<{ projects: unknown[] }>("/founder/projects", {
      headers: { "X-Request-Id": "req-domain" },
    });

    expect(data).toEqual({ projects: [] });
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/founder/projects");
    expect(init.method).toBe("GET");
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer jwt-domain");
    expect(requestHeaders["X-Request-Id"]).toBe("req-domain");
    expect(Boolean(init.signal)).toBe(true);
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("domainPost and domainPatch serialize canonical domain mutations", async () => {
  setAuthTokenGetter(() => "jwt-domain-2");
  const fetchMock = stubFetch(async () => response({ ok: true }));

  try {
    await domainPost("/founder/projects", { title: "Live Venture" });
    await domainPatch("/founder/projects/project_1", { stage: "mvp" });

    const [, postInit] = fetchMock.calls[0] as [string, RequestInit];
    const [, patchInit] = fetchMock.calls[1] as [string, RequestInit];
    expect(postInit.method).toBe("POST");
    expect(postInit.body).toBe(JSON.stringify({ title: "Live Venture" }));
    expect(patchInit.method).toBe("PATCH");
    expect(patchInit.body).toBe(JSON.stringify({ stage: "mvp" }));
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("domain client surfaces backend failures without fallback records", async () => {
  const fetchMock = stubFetch(async () => response({ error: "domain unavailable" }, {
    status: 503,
    statusText: "Service Unavailable",
  }));

  try {
    let error: unknown;
    try {
      await domainGet("/collaborator/equity");
    } catch (err) {
      error = err;
    }

    expect(error instanceof ApiError).toBe(true);
    expect((error as ApiError).status).toBe(503);
    expect((error as ApiError).body).toEqual({ error: "domain unavailable" });
  } finally {
    fetchMock.restore();
  }
});
