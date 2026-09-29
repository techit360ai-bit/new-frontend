import { expect, test, vi } from "vitest";
import { TechitApiError, setTechitApiTokenGetter, techitApi } from "./techitApi";

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

function resetTokenGetter() {
  setTechitApiTokenGetter(() => {
    try {
      return localStorage.getItem("techit_token");
    } catch {
      return null;
    }
  });
}

test("MCP GET requests use the configured base URL and forward the stored platform token", async () => {
  const storage = stubLocalStorage();
  localStorage.setItem("techit_token", "jwt-mcp");
  const fetchMock = stubFetch(async () => response({ ok: true, workspaceId: "ws-prod" }));

  try {
    const health = await techitApi.health();

    expect(health).toEqual({ ok: true, workspaceId: "ws-prod" });
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/mcp/health");
    expect(init.method).toBe("GET");
    const requestHeaders = init.headers as Record<string, string>;
    expect(requestHeaders.Authorization).toBe("Bearer jwt-mcp");
    expect(requestHeaders["Content-Type"]).toBe("application/json");
  } finally {
    fetchMock.restore();
    storage.restore();
    resetTokenGetter();
  }
});

test("MCP POST requests preserve bearer auth for invoke and approval decisions", async () => {
  setTechitApiTokenGetter(() => "jwt-owner");
  const fetchMock = stubFetch(async () => response({ ok: true, data: { id: 1 } }));

  try {
    await techitApi.invoke("github", "list_issues", { repo: "techit/app" }, { kind: "human", role: "owner" });
    await techitApi.approve("approval-1");

    expect(fetchMock.calls).toHaveLength(2);
    const invoke = fetchMock.calls[0] as [string, RequestInit];
    expect(invoke[0]).toBe("http://localhost:3000/api/mcp/invoke");
    expect(invoke[1].method).toBe("POST");
    expect(invoke[1].body).toBe(JSON.stringify({
      plugin: "github",
      tool: "list_issues",
      params: { repo: "techit/app" },
      actor: { kind: "human", role: "owner" },
    }));

    const approval = fetchMock.calls[1] as [string, RequestInit];
    expect(approval[0]).toBe("http://localhost:3000/api/mcp/approvals/approval-1/approve");
    expect(approval[1].body).toBe(JSON.stringify({ decidedBy: "founder" }));

    for (const [, init] of fetchMock.calls) {
      const requestHeaders = init?.headers as Record<string, string>;
      expect(requestHeaders.Authorization).toBe("Bearer jwt-owner");
      expect(requestHeaders["Content-Type"]).toBe("application/json");
    }
  } finally {
    fetchMock.restore();
    resetTokenGetter();
  }
});

// WS-01 removed the sessionStorage writer for the access token. This locks the
// default getter to the tab-scoped in-memory token so the MCP/plugins surface
// cannot silently fall back to reading a key that no longer exists.
test("default token getter uses the in-memory token and ignores legacy sessionStorage", async () => {
  const reads: string[] = [];
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => {
        reads.push(key);
        return key === "techit_access_token" ? "legacy-storage-token" : null;
      },
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
  });

  vi.resetModules();
  const client = await import("./api/client");
  client.setAccessToken("in-memory-token");

  const fetchMock = stubFetch(() => response({ ok: true, workspaceId: "w1" }));
  try {
    const fresh = await import("./techitApi");
    await fresh.techitApi.health();

    const sent = (fetchMock.calls[0][1]?.headers ?? {}) as Record<string, string>;
    expect(sent.Authorization).toBe("Bearer in-memory-token");
    expect(sent.Authorization).not.toContain("legacy-storage-token");
    expect(reads).not.toContain("techit_access_token");
  } finally {
    fetchMock.restore();
    client.setAccessToken(null);
    if (originalStorage) Object.defineProperty(globalThis, "sessionStorage", originalStorage);
    else delete (globalThis as { sessionStorage?: unknown }).sessionStorage;
    vi.resetModules();
  }
});

test("MCP client throws parsed backend auth errors instead of returning them as success payloads", async () => {
  const fetchMock = stubFetch(async () => response(
    { ok: false, error: { code: "unauthenticated", error: "Missing or invalid token" } },
    { status: 401, statusText: "Unauthorized" },
  ));

  try {
    let error: unknown;
    try {
      await techitApi.tools();
    } catch (err) {
      error = err;
    }

    expect(error instanceof TechitApiError).toBe(true);
    expect((error as TechitApiError).status).toBe(401);
    expect((error as TechitApiError).body).toEqual({
      ok: false,
      error: { code: "unauthenticated", error: "Missing or invalid token" },
    });
  } finally {
    fetchMock.restore();
    resetTokenGetter();
  }
});
