import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { fetchPlatformMetrics } from "./organization";

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
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
    restore: () => { globalThis.fetch = original; },
  };
}

test("platform metrics read the canonical ledger endpoint and normalize totals", async () => {
  setAuthTokenGetter(() => "jwt-metrics");
  const fetchMock = stubFetch(async () => response({
    ok: true,
    scope: "founder",
    totals: { startups: 3, prototypes: 3, mvpCompleted: 2, productsLaunched: 1, growth: 0, milestones: 4, completedMilestones: 2, founders: 2 },
    founder: { founderId: "user-uuid-1", startups: 2, prototypes: 2, mvpCompleted: 2, productsLaunched: 1, growth: 0, milestones: 4, completedMilestones: 2, founders: 2 },
    generatedAt: "2026-10-13T00:00:00.000Z",
  }));

  try {
    const metrics = await fetchPlatformMetrics();
    expect(metrics.totals).toMatchObject({ startups: 3, mvpCompleted: 2, productsLaunched: 1, completedMilestones: 2 });
    expect(metrics.founder).toMatchObject({ founderId: "user-uuid-1", mvpCompleted: 2 });
    expect(metrics.perFounder).toBeUndefined();
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/platform/metrics");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-metrics");
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});
