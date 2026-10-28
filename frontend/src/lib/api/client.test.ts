import { expect, test } from "vitest";
import { ApiError, apiGet, apiPost, setAuthTokenGetter, withFallback } from "./client";
import { env } from "./config";

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

function captureWarn() {
  const original = console.warn;
  const calls: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    calls.push(args);
  };

  return {
    calls,
    restore: () => {
      console.warn = original;
    },
  };
}

function resetAuth() {
  setAuthTokenGetter(() => null);
}

test("apiGet builds versioned ai-router URLs and forwards bearer auth with caller headers", async () => {
  setAuthTokenGetter(() => "jwt-123");
  const fetchMock = stubFetch(async () => response({ ok: true }));

  try {
    const data = await apiGet<{ ok: boolean }>("/dashboard/intelligence", {
      headers: { "X-Request-Id": "req-1" },
    });

    expect(data).toEqual({ ok: true });
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/dashboard/intelligence");
    expect(init.method).toBe("GET");
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer jwt-123");
    expect(requestHeaders["Content-Type"]).toBe("application/json");
    expect(requestHeaders["X-Request-Id"]).toBe("req-1");
    expect(Boolean(init.signal)).toBe(true);
  } finally {
    fetchMock.restore();
    resetAuth();
  }
});

test("apiPost serializes JSON body and preserves auth headers when init overrides method", async () => {
  setAuthTokenGetter(() => "jwt-456");
  const fetchMock = stubFetch(async () => response({ id: "score-1" }));

  try {
    await apiPost("/gsis/compute", { component_scores: { traction: 80 } }, {
      method: "PUT",
      headers: { "X-Request-Id": "req-2" },
    });

    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("PUT");
    expect(init.body).toBe(JSON.stringify({ component_scores: { traction: 80 } }));
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer jwt-456");
    expect(requestHeaders["Content-Type"]).toBe("application/json");
    expect(requestHeaders["X-Request-Id"]).toBe("req-2");
  } finally {
    fetchMock.restore();
    resetAuth();
  }
});

test("apiGet throws ApiError with parsed response body on non-2xx responses", async () => {
  const fetchMock = stubFetch(async () => response({ error: "no credits" }, {
    status: 402,
    statusText: "Payment Required",
  }));

  try {
    let error: unknown;
    try {
      await apiGet("/dashboard/intelligence");
    } catch (err) {
      error = err;
    }

    expect(error instanceof ApiError).toBe(true);
    expect((error as ApiError).name).toBe("ApiError");
    expect((error as ApiError).status).toBe(402);
    expect((error as ApiError).body).toEqual({ error: "no credits" });
  } finally {
    fetchMock.restore();
    resetAuth();
  }
});

test("withFallback returns fallback data and logs when fallback mode is enabled", async () => {
  const previousFallback = env.VITE_API_FALLBACK;
  const previousStrict = env.VITE_API_STRICT;
  delete env.VITE_API_STRICT;
  if (typeof process !== "undefined" && process.env) delete process.env.VITE_API_STRICT;
  env.VITE_API_FALLBACK = "1";
  const warn = captureWarn();

  try {
    const data = await withFallback(
      async () => {
        throw new Error("offline");
      },
      () => ({ cached: true }),
      "dashboard",
    );

    expect(data).toEqual({ cached: true });
    expect(warn.calls).toHaveLength(1);
    expect(String(warn.calls[0][0])).toContain("dashboard failed; using mock fallback");
  } finally {
    if (previousFallback === undefined) delete env.VITE_API_FALLBACK;
    else env.VITE_API_FALLBACK = previousFallback;
    if (previousStrict === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previousStrict;
    warn.restore();
    resetAuth();
  }
});

test("withFallback is strict by default in production mode", async () => {
  const previousMode = env.MODE;
  const previousDev = env.DEV;
  const previousFallback = env.VITE_API_FALLBACK;
  const previousStrict = env.VITE_API_STRICT;
  env.MODE = "production";
  env.DEV = false;
  delete env.VITE_API_FALLBACK;
  delete env.VITE_API_STRICT;

  try {
    let error: unknown;
    try {
      await withFallback(
        async () => { throw new Error("production unavailable"); },
        { fake: true },
        "production",
      );
    } catch (caught) {
      error = caught;
    }
    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("production unavailable");
  } finally {
    if (previousMode === undefined) delete env.MODE;
    else env.MODE = previousMode;
    if (previousDev === undefined) delete env.DEV;
    else env.DEV = previousDev;
    if (previousFallback === undefined) delete env.VITE_API_FALLBACK;
    else env.VITE_API_FALLBACK = previousFallback;
    if (previousStrict === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previousStrict;
  }
});

test("withFallback rethrows failures when strict API mode is enabled", async () => {
  const previous = env.VITE_API_STRICT;
  env.VITE_API_STRICT = "1";
  const warn = captureWarn();

  try {
    let error: unknown;
    try {
      await withFallback(
        async () => {
          throw new Error("ai-router unavailable");
        },
        () => ({ cached: true }),
        "dashboard",
      );
    } catch (err) {
      error = err;
    }

    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("ai-router unavailable");
    expect(warn.calls).toHaveLength(0);
  } finally {
    if (previous === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previous;
    warn.restore();
    resetAuth();
  }
});
