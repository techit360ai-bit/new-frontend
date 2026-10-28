import { expect, test } from "vitest";
import { fetchTrustProfile, refreshTrustSource } from "./trust";

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

test("fetchTrustProfile calls the ai-router Trust profile endpoint", async () => {
  const fetchMock = stubFetch(async () => response({ trust_score: 72, tier: "Verified" }));

  try {
    const profile = await fetchTrustProfile();

    expect(profile.trust_score).toBe(72);
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/trust/profile");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("refreshTrustSource posts to the source-specific manual reverification endpoint", async () => {
  const fetchMock = stubFetch(async () => response({
    source: "github",
    status: "pending",
    confidence: 0.5,
    metadata_hash: "hash",
    raw_payload_stored: false,
  }));

  try {
    const result = await refreshTrustSource("github");

    expect(result.source).toBe("github");
    expect(result.status).toBe("pending");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/trust/refresh/github");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({}));
  } finally {
    fetchMock.restore();
  }
});
