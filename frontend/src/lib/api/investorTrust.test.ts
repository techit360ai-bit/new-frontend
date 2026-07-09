import { expect, test } from "vitest";
import {
  FALLBACK_INVESTOR_TRUST_LIST,
  fallbackInvestorTrustDashboard,
  fetchInvestorTrustDashboard,
  fetchInvestorTrustStartups,
  saveInvestorTrustNotes,
} from "./investorTrust";

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

test("fetchInvestorTrustStartups calls the investor-safe startup list endpoint", async () => {
  const payload = {
    startups: [],
    watchlistStartupIds: [],
    privacy: FALLBACK_INVESTOR_TRUST_LIST.privacy,
  };
  const fetchMock = stubFetch(async () => response(payload));

  try {
    const result = await fetchInvestorTrustStartups();

    expect(result).toEqual(payload);
    expect(fetchMock.calls).toHaveLength(1);
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/startups");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("fetchInvestorTrustDashboard calls the selected startup trust endpoint", async () => {
  const payload = fallbackInvestorTrustDashboard("1");
  const fetchMock = stubFetch(async () => response(payload));

  try {
    const result = await fetchInvestorTrustDashboard("1");

    expect(result.startup.startupId).toBe("1");
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/1");
    expect(init.method).toBe("GET");
  } finally {
    fetchMock.restore();
  }
});

test("saveInvestorTrustNotes keeps notes private behind the investor trust notes endpoint", async () => {
  const notes = fallbackInvestorTrustDashboard("1").investorNotes;
  const fetchMock = stubFetch(async () => response({ ok: true, investorNotes: notes }));

  try {
    const result = await saveInvestorTrustNotes("1", notes);

    expect(result).toEqual({ ok: true, investorNotes: notes });
    const [url, init] = fetchMock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://localhost:8000/api/v1/investor/trust/1/notes");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify(notes));
  } finally {
    fetchMock.restore();
  }
});

test("fallback list auto-includes watchlist startups and still supports non-watchlist search results", () => {
  const list = FALLBACK_INVESTOR_TRUST_LIST;
  const startupIds = new Set(list.startups.map((startup) => startup.startupId));
  const flaggedWatchlistIds = list.startups
    .filter((startup) => startup.watchlistIncluded)
    .map((startup) => startup.startupId);

  expect(list.watchlistStartupIds).toEqual(["1", "2", "3", "4"]);
  expect(list.watchlistStartupIds.every((startupId) => startupIds.has(startupId))).toBe(true);
  expect(flaggedWatchlistIds).toEqual(list.watchlistStartupIds);
  expect(list.startups.some((startup) => !startup.watchlistIncluded)).toBe(true);
  expect(list.startups.find((startup) => startup.name === "CloudMesh")?.watchlistIncluded).toBe(false);
});

test("fallback trust data only exposes approved metadata and private investor notes", () => {
  const dashboard = fallbackInvestorTrustDashboard("1");

  expect(dashboard.privacy.metadataOnly).toBe(true);
  expect(dashboard.privacy.approvedEvidenceOnly).toBe(true);
  expect(dashboard.privacy.rawPayloadsExposed).toBe(false);
  expect(dashboard.privacy.customerDataExposed).toBe(false);
  expect(dashboard.privacy.sourceCodeExposed).toBe(false);
  expect(dashboard.privacy.investorNotesPrivate).toBe(true);
  expect(dashboard.privacy.founderVisible).toBe(false);
});
