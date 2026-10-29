import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import { fetchCapitalPools } from "./capitalPools";
import { fetchDataRooms } from "./dataRooms";
import { addToWatchlist, fetchDealFlow } from "./dealFlow";
import { fetchDealRooms } from "./dealRooms";
import { fetchHeatmap } from "./heatmap";
import { fetchInvestorReputation } from "./investorReputation";

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
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

test("investor domain APIs read canonical BACKEND live endpoints", async () => {
  setAuthTokenGetter(() => "jwt-investor");
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/investor/capital-pools")) {
      return response({
        capitalPools: [{
          id: "pool_1",
          name: "Live Seed Pool",
          totalCapital: 500000,
          deployed: 100000,
          startups: 2,
          milestonesHit: 1,
          fundsReleased: 50000,
          roiSimulation: 1.4,
          rules: { minReadiness: 70, maxPerStartup: 20, milestoneTrigger: true },
        }],
      });
    }
    if (url.endsWith("/investor/deal-flow")) {
      return response({
        ranking: [{
          id: "snapshot_1",
          projectId: "project_1",
          project: { id: "project_1", title: "LiveCo", industry: "AI", gsisScore: 82 },
          eviI: 77,
          rankScore: 112,
          watchlisted: true,
          mrr: 25000,
          riskLevel: "low",
          aiGovernanceVerified: true,
        }],
        watchlistProjectIds: ["project_1"],
      });
    }
    if (url.endsWith("/investor/deal-rooms")) {
      return response({
        dealRooms: [{
          id: "deal_1",
          projectId: "project_1",
          startupName: "LiveCo",
          sector: "AI",
          status: "active",
          stage: "Due Diligence",
          daysOpen: 4,
          messages: 3,
          docs: 2,
          lastActivity: "today",
        }],
      });
    }
    if (url.endsWith("/investor/data-rooms")) {
      return response({
        dataRooms: [{
          id: "data_1",
          projectId: "project_1",
          startupName: "LiveCo",
          sector: "AI",
          sections: ["Financials"],
          docCount: 3,
          complianceVerified: true,
          aiGovernanceVerified: false,
          updatedLabel: "today",
        }],
      });
    }
    if (url.endsWith("/investor/heatmap")) {
      return response({
        heatmap: {
          regions: [{ name: "Europe", avgReadiness: 81, complianceRate: 75, color: "text-status-info" }],
          sectors: [{ sector: "AI", avgGrowth: 12 }],
        },
      });
    }
    if (url.endsWith("/investor/reputation")) {
      return response({
        reputation: {
          score: 88,
          level: "Elite",
          monthChange: 2,
          metrics: [],
          reviews: [],
          progression: [],
          leaderboard: { rank: 4, total: 120, percentile: 3 },
        },
      });
    }
    throw new Error(`unexpected ${url}`);
  });

  try {
    const pools = await fetchCapitalPools();
    const dealFlow = await fetchDealFlow();
    const dealRooms = await fetchDealRooms();
    const dataRooms = await fetchDataRooms();
    const heatmap = await fetchHeatmap();
    const reputation = await fetchInvestorReputation();

    expect(fetchMock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3000/api/domain/investor/capital-pools",
      "http://localhost:3000/api/domain/investor/deal-flow",
      "http://localhost:3000/api/domain/investor/deal-rooms",
      "http://localhost:3000/api/domain/investor/data-rooms",
      "http://localhost:3000/api/domain/investor/heatmap",
      "http://localhost:3000/api/domain/investor/reputation",
    ]);
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-investor");
    expect(pools[0]?.name).toBe("Live Seed Pool");
    expect(dealFlow.ranking[0]).toMatchObject({
      id: "project_1",
      name: "LiveCo",
      sector: "AI",
      readinessScore: 82,
      executionVelocity: 77,
      watchlisted: true,
    });
    expect(dealFlow.metrics.watchlistedStartups).toBe(1);
    expect(dealRooms.rooms[0]?.startupName).toBe("LiveCo");
    expect(dealRooms.dealMeta.project_1.stage).toBe("Due Diligence");
    expect(dataRooms.totals).toEqual({
      activeRooms: 1,
      totalDocs: 3,
      complianceVerified: 1,
      aiSummaries: 0,
    });
    expect(heatmap.regions[0]?.name).toBe("Europe");
    expect(reputation.score).toBe(88);
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("investor domain APIs return empty live state instead of bundled fallback records", async () => {
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/investor/capital-pools")) return response({ capitalPools: [] });
    if (url.endsWith("/investor/deal-flow")) return response({ ranking: [], watchlistProjectIds: [] });
    if (url.endsWith("/investor/deal-rooms")) return response({ dealRooms: [] });
    if (url.endsWith("/investor/data-rooms")) return response({ dataRooms: [] });
    if (url.endsWith("/investor/heatmap")) return response({ heatmap: [] });
    if (url.endsWith("/investor/reputation")) return response({ reputation: [] });
    throw new Error(`unexpected ${url}`);
  });

  try {
    await expect(fetchCapitalPools()).resolves.toEqual([]);
    await expect(fetchDealFlow()).resolves.toMatchObject({
      ranking: [],
      rawRanking: [],
      watchlistProjectIds: [],
      metrics: { totalStartups: 0, watchlistedStartups: 0 },
    });
    await expect(fetchDealRooms()).resolves.toMatchObject({ rooms: [], dealMeta: {} });
    await expect(fetchDataRooms()).resolves.toMatchObject({
      rooms: [],
      totals: { activeRooms: 0, totalDocs: 0, complianceVerified: 0, aiSummaries: 0 },
    });
    await expect(fetchHeatmap()).resolves.toEqual({ regions: [], sectors: [] });
    await expect(fetchInvestorReputation()).resolves.toMatchObject({
      score: 0,
      level: "Unrated",
      metrics: [],
      reviews: [],
    });
  } finally {
    fetchMock.restore();
  }
});

test("investor watchlist mutation persists through BACKEND domain endpoint", async () => {
  const fetchMock = stubFetch(async () => response({ ok: true, watchlistItem: { projectId: "project_1" } }));

  try {
    await expect(addToWatchlist("project_1", "priority")).resolves.toEqual({ ok: true });

    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:3000/api/domain/investor/watchlist");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ projectId: "project_1", notes: "priority" }));
  } finally {
    fetchMock.restore();
  }
});
