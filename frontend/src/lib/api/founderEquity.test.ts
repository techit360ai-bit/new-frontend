import { afterEach, expect, test, vi } from "vitest";
import { setAuthTokenGetter } from "./client";
import { EMPTY_CAP_TABLE, fetchFounderCapTable } from "./founderEquity";

afterEach(() => {
  vi.unstubAllGlobals();
  setAuthTokenGetter(() => null);
});

function response(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

test("founder cap table reads the authenticated derived-equity endpoint", async () => {
  setAuthTokenGetter(() => "jwt-equity");
  const fetchMock = vi.fn(async () => response({
    ventures: [{
      workspaceId: "ws_1",
      projectId: "proj_1",
      name: "Ledger",
      committedPercent: 8,
      retainedPercent: 92,
      retainedDerived: true,
      grants: [{ collaboratorId: "u3", collaboratorName: "Carol Smith", role: "Engineer", equityPercent: 8 }],
      pending: [{ invitationId: "inv_2", collaboratorId: "u2", collaboratorName: "Bob Smith", role: "Designer", equityPercent: 4 }],
    }],
    totals: { ventures: 1, venturesWithEquity: 1, committedGrants: 1, pendingProposals: 1, averageRetainedPercent: 92 },
    basis: "Derived from equity commitments recorded on workspace invitations.",
  }));
  vi.stubGlobal("fetch", fetchMock);

  const table = await fetchFounderCapTable();
  expect(table.ventures[0].retainedDerived).toBe(true);
  expect(table.ventures[0].grants[0]).toMatchObject({ collaboratorId: "u3", equityPercent: 8 });
  expect(table.totals).toMatchObject({ ventures: 1, committedGrants: 1, pendingProposals: 1 });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/founder/equity",
    expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Authorization: "Bearer jwt-equity" }),
    }),
  );
});

test("founder cap table falls back to an honest empty state when fields are missing", async () => {
  const fetchMock = vi.fn(async () => response({}));
  vi.stubGlobal("fetch", fetchMock);

  const table = await fetchFounderCapTable();
  expect(table.ventures).toEqual([]);
  expect(table.totals).toEqual(EMPTY_CAP_TABLE.totals);
  expect(table.basis).toBe("");
});
