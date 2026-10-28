import { expect, test } from "vitest";
import { msgDelete, msgGet, msgPatch, msgPost, withFallback } from "./client";
import { env } from "./config";

function response(body: unknown, init: ResponseInit = {}) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function stubLocalStorage() {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    removeItem: (key: string) => store.delete(key),
    setItem: (key: string, value: string) => store.set(key, value),
    },
  });

  return {
    restore: () => {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    },
  };
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

test("msgGet uses the messaging base URL and forwards the stored platform token", async () => {
  const storage = stubLocalStorage();
  localStorage.setItem("techit_token", "jwt-msg");
  const fetchMock = stubFetch(async () => response({ conversations: [] }));

  try {
    await msgGet("/api/v1/conversations", { headers: { "X-Request-Id": "req-msg-1" } });

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8080/api/v1/conversations");
    expect(init.method).toBe("GET");
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer jwt-msg");
    expect(requestHeaders["Content-Type"]).toBe("application/json");
    expect(requestHeaders["X-Request-Id"]).toBe("req-msg-1");
  } finally {
    fetchMock.restore();
    storage.restore();
  }
});

test("msgPost, msgPatch, and msgDelete preserve auth headers after spreading init", async () => {
  const storage = stubLocalStorage();
  localStorage.setItem("techit_token", "jwt-msg-2");
  const fetchMock = stubFetch(async () => response({ ok: true }));

  try {
    await msgPost("/api/v1/conversations", { userId: "u2" }, { headers: { "X-Request-Id": "post" } });
    await msgPatch("/api/v1/messages/m1", { read: true }, { headers: { "X-Request-Id": "patch" } });
    await msgDelete("/api/v1/posts/p1", { headers: { "X-Request-Id": "delete" } });

    for (const call of fetchMock.calls) {
      const [, init] = call as [string, RequestInit];
      const requestHeaders = init.headers as Record<string, string>;
      expect(requestHeaders.Authorization).toBe("Bearer jwt-msg-2");
      expect(requestHeaders["Content-Type"]).toBe("application/json");
    }
    expect((fetchMock.calls[0][1] as RequestInit).body).toBe(JSON.stringify({ userId: "u2" }));
    expect((fetchMock.calls[1][1] as RequestInit).body).toBe(JSON.stringify({ read: true }));
    expect((fetchMock.calls[2][1] as RequestInit).method).toBe("DELETE");
  } finally {
    fetchMock.restore();
    storage.restore();
  }
});

test("messaging withFallback returns fallback data on failures", async () => {
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
      [],
      "conversations",
    );

    expect(data).toEqual([]);
    expect(warn.calls).toHaveLength(1);
    expect(String(warn.calls[0][0])).toContain("conversations failed; using fallback");
  } finally {
    if (previousFallback === undefined) delete env.VITE_API_FALLBACK;
    else env.VITE_API_FALLBACK = previousFallback;
    if (previousStrict === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previousStrict;
    warn.restore();
  }
});

test("messaging fallback is strict by default in production mode", async () => {
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
        async () => { throw new Error("messaging production unavailable"); },
        [],
        "production messaging",
      );
    } catch (caught) {
      error = caught;
    }
    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("messaging production unavailable");
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

test("messaging withFallback rethrows failures when strict API mode is enabled", async () => {
  const previous = env.VITE_API_STRICT;
  env.VITE_API_STRICT = "1";
  const warn = captureWarn();

  try {
    let error: unknown;
    try {
      await withFallback(
        async () => {
          throw new Error("messaging unavailable");
        },
        [],
        "demos",
      );
    } catch (err) {
      error = err;
    }

    expect(error instanceof Error).toBe(true);
    expect((error as Error).message).toContain("messaging unavailable");
    expect(warn.calls).toHaveLength(0);
  } finally {
    if (previous === undefined) delete env.VITE_API_STRICT;
    else env.VITE_API_STRICT = previous;
    warn.restore();
  }
});
