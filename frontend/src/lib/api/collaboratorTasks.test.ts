import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  createCollaboratorTask,
  fetchCollaboratorTasks,
  normalizeCollaboratorTask,
  patchCollaboratorTask,
} from "./collaboratorTasks";

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

test("collaborator tasks aggregate live workspace task collections", async () => {
  setAuthTokenGetter(() => "jwt-collab-task");
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/workspaces")) {
      return response({
        workspaces: [
          { id: "ws_1", projectId: "project_1", name: "Live Workspace", status: "active", seededFromAnalysis: false },
          { id: "ws_2", projectId: "project_2", name: "Second Workspace", status: "active", seededFromAnalysis: false },
        ],
      });
    }
    if (url.endsWith("/workspaces/ws_1/tasks")) {
      return response({
        tasks: [{
          id: "task_1",
          title: "Ship persisted task",
          priority: "high",
          deadline: "2026-07-15",
          impactScore: 88,
          status: "pending",
          aiRank: 2,
        }],
      });
    }
    if (url.endsWith("/workspaces/ws_2/tasks")) {
      return response({
        tasks: [{
          id: "task_2",
          prompt: "Review live agent output",
          status: "running",
          score: 42,
          rank: 1,
        }],
      });
    }
    throw new Error(`unexpected ${url}`);
  });

  try {
    const snapshot = await fetchCollaboratorTasks();

    expect(fetchMock.calls.map(([url]) => url)).toEqual([
      "http://localhost:3000/api/domain/workspaces",
      "http://localhost:3000/api/domain/workspaces/ws_1/tasks",
      "http://localhost:3000/api/domain/workspaces/ws_2/tasks",
    ]);
    const [, init] = fetchMock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer jwt-collab-task");
    expect(snapshot.projects).toEqual([
      { id: "project_1", workspaceId: "ws_1", name: "Live Workspace" },
      { id: "project_2", workspaceId: "ws_2", name: "Second Workspace" },
    ]);
    expect(snapshot.tasks.map((task) => task.id)).toEqual(["task_2", "task_1"]);
    expect(snapshot.tasks[0]).toMatchObject({
      title: "Review live agent output",
      projectId: "project_2",
      projectName: "Second Workspace",
      status: "in-progress",
      priority: "high",
      impactScore: 42,
    });
  } finally {
    fetchMock.restore();
    setAuthTokenGetter(() => null);
  }
});

test("collaborator tasks return empty live state without fixture tasks", async () => {
  const fetchMock = stubFetch(async (url) => {
    if (url.endsWith("/workspaces")) return response({ workspaces: [] });
    throw new Error(`unexpected ${url}`);
  });

  try {
    await expect(fetchCollaboratorTasks()).resolves.toEqual({ projects: [], tasks: [] });
  } finally {
    fetchMock.restore();
  }
});

test("collaborator task create and patch use workspace domain endpoints", async () => {
  const fetchMock = stubFetch(async (url, init) => {
    if (url.endsWith("/workspaces/ws_1/tasks") && init?.method === "POST") {
      return response({ task: { id: "task_new", title: "New task", workspaceId: "ws_1", status: "pending" } });
    }
    if (url.endsWith("/workspaces/ws_1/tasks/task_new") && init?.method === "PATCH") {
      return response({ task: { id: "task_new", title: "New task", workspaceId: "ws_1", status: "completed" } });
    }
    throw new Error(`unexpected ${url}`);
  });

  try {
    const created = await createCollaboratorTask({
      workspaceId: "ws_1",
      projectId: "project_1",
      projectName: "Live Workspace",
      title: "New task",
      priority: "medium",
      deadline: "2026-07-16",
      impactScore: 50,
    });
    const patched = await patchCollaboratorTask(created, { status: "completed" });

    expect(fetchMock.calls[0]?.[0]).toBe("http://localhost:3000/api/domain/workspaces/ws_1/tasks");
    expect(fetchMock.calls[0]?.[1]?.method).toBe("POST");
    expect(fetchMock.calls[0]?.[1]?.body).toBe(JSON.stringify({
      title: "New task",
      prompt: "New task",
      projectId: "project_1",
      projectName: "Live Workspace",
      priority: "medium",
      deadline: "2026-07-16",
      impactScore: 50,
      dependencies: [],
      aiReason: "",
      status: "pending",
    }));
    expect(fetchMock.calls[1]?.[0]).toBe("http://localhost:3000/api/domain/workspaces/ws_1/tasks/task_new");
    expect(fetchMock.calls[1]?.[1]?.method).toBe("PATCH");
    expect(fetchMock.calls[1]?.[1]?.body).toBe(JSON.stringify({ status: "completed" }));
    expect(patched.status).toBe("completed");
  } finally {
    fetchMock.restore();
  }
});

test("collaborator task normalizer tolerates partial live rows", () => {
  expect(normalizeCollaboratorTask({ title: "Partial" }, {
    id: "project_1",
    workspaceId: "ws_1",
    name: "Live Workspace",
  })).toMatchObject({
    id: "task-ws_1-1",
    title: "Partial",
    projectId: "project_1",
    projectName: "Live Workspace",
    status: "pending",
    priority: "medium",
  });
});
