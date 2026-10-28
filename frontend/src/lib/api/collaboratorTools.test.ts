import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  createCollaboratorTool,
  fetchCollaboratorTools,
  normalizeCollaboratorTool,
  patchCollaboratorTool,
} from "./collaboratorTools";

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

test("collaborator tools aggregate live workspace connectors", async () => {
  setAuthTokenGetter(() => "jwt-tools");
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/workspaces")) {
      return response({
        workspaces: [
          { id: "ws_1", projectId: "project_1", name: "Live Workspace" },
          { id: "ws_2", projectId: "project_2", name: "Second Workspace" },
        ],
      });
    }
    if (url.endsWith("/workspaces/ws_1/connectors")) {
      return response({
        connectors: [{
          id: "github",
          name: "GitHub",
          status: "connected",
          resources: ["repo:read"],
          lastSync: "2026-07-13T10:00:00Z",
          updates: "4",
        }],
      });
    }
    if (url.endsWith("/workspaces/ws_2/connectors")) return response({ connectors: [] });
    throw new Error(`unexpected ${url}`);
  });

  try {
    const snapshot = await fetchCollaboratorTools();

    expect(fetchMock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3000/api/domain/workspaces",
      "http://localhost:3000/api/domain/workspaces/ws_1/connectors",
      "http://localhost:3000/api/domain/workspaces/ws_2/connectors",
    ]);
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-tools");
    expect(snapshot.workspaces).toEqual([
      { id: "ws_1", name: "Live Workspace" },
      { id: "ws_2", name: "Second Workspace" },
    ]);
    expect(snapshot.tools[0]).toMatchObject({
      id: "github",
      workspaceId: "ws_1",
      workspaceName: "Live Workspace",
      status: "connected",
      scopes: ["repo:read"],
      updates: 4,
    });
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("collaborator tools return empty live state without bundled fixtures", async () => {
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/workspaces")) return response({ workspaces: [] });
    throw new Error(`unexpected ${url}`);
  });

  try {
    await expect(fetchCollaboratorTools()).resolves.toEqual({ workspaces: [], tools: [] });
  } finally {
    fetchMock.restore();
  }
});

test("collaborator tool create and patch use workspace connector endpoints", async () => {
  const fetchMock = stubFetch(async (url, init) => {
    if (url.endsWith("/workspaces/ws_1/connectors") && init?.method === "POST") {
      return response({ connector: { id: "posthog", name: "PostHog", workspaceId: "ws_1", status: "disconnected" } });
    }
    if (url.endsWith("/workspaces/ws_1/connectors/posthog") && init?.method === "PATCH") {
      return response({ connector: { id: "posthog", name: "PostHog", workspaceId: "ws_1", status: "connected" } });
    }
    throw new Error(`unexpected ${url}`);
  });

  try {
    const created = await createCollaboratorTool("ws_1", "PostHog");
    const patched = await patchCollaboratorTool({ ...created, workspaceName: "Live Workspace" }, { status: "connected" });

    expect(fetchMock.calls[0]?.[0]).toBe("http://localhost:3000/api/domain/workspaces/ws_1/connectors");
    expect(fetchMock.calls[0]?.[1]?.method).toBe("POST");
    expect(fetchMock.calls[0]?.[1]?.body).toBe(JSON.stringify({
      id: "posthog",
      name: "PostHog",
      status: "disconnected",
      scopes: [],
      updates: 0,
      lastSyncedAt: null,
    }));
    expect(fetchMock.calls[1]?.[0]).toBe("http://localhost:3000/api/domain/workspaces/ws_1/connectors/posthog");
    expect(fetchMock.calls[1]?.[1]?.method).toBe("PATCH");
    expect(fetchMock.calls[1]?.[1]?.body).toBe(JSON.stringify({ status: "connected" }));
    expect(patched.status).toBe("connected");
  } finally {
    fetchMock.restore();
  }
});

test("collaborator tool normalizer tolerates partial connector rows", () => {
  expect(normalizeCollaboratorTool({ name: "Linear" }, { id: "ws_1", name: "Live Workspace" })).toMatchObject({
    id: "linear",
    workspaceId: "ws_1",
    workspaceName: "Live Workspace",
    status: "disconnected",
    scopes: [],
    updates: 0,
  });
});
