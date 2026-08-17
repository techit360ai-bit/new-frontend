import { expect, test } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  acceptWorkspaceInvitation,
  fetchWorkspaceInvitation,
  inviteWorkspaceCollaborator,
} from "./workspaces";

function response(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
}

test("creates a targeted workspace invitation with access and ownership proposal", async () => {
  setAuthTokenGetter(() => "jwt-founder");
  const original = globalThis.fetch;
  const calls: Array<[string, RequestInit | undefined]> = [];
  globalThis.fetch = (async (url, init) => {
    calls.push([String(url), init]);
    return response({ invitation: { id: "invite_1", workspaceId: "ws_1", status: "pending" } });
  }) as typeof fetch;
  try {
    await inviteWorkspaceCollaborator("ws_1", {
      collaboratorId: "user_2",
      requestedRole: "Backend Engineer",
      scope: "Own the API.",
      requiredSkills: ["Node.js"],
      compensationMode: "equity-heavy",
      equityProposal: 4,
      cashReward: 0,
      accessLevel: "contributor",
    });
    expect(calls[0]?.[0]).toBe("http://localhost:3000/api/domain/workspaces/ws_1/invitations");
    expect(JSON.parse(String(calls[0]?.[1]?.body))).toMatchObject({ collaboratorId: "user_2", accessLevel: "contributor", equityProposal: 4 });
  } finally {
    globalThis.fetch = original;
    setAuthTokenGetter(() => null);
  }
});

test("reads and accepts only through the authenticated invitation endpoints", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = (async (url) => {
    calls.push(String(url));
    return response({ invitation: { id: "invite_1", workspaceId: "ws_1", status: "pending" } });
  }) as typeof fetch;
  try {
    await fetchWorkspaceInvitation("invite_1");
    await acceptWorkspaceInvitation("invite_1");
    expect(calls).toEqual([
      "http://localhost:3000/api/domain/workspace-invitations/invite_1",
      "http://localhost:3000/api/domain/workspace-invitations/invite_1/accept",
    ]);
  } finally {
    globalThis.fetch = original;
  }
});
