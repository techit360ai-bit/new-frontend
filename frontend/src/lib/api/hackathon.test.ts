import { afterEach, expect, test, vi } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  fetchHackathonRegistrations,
  inviteHackathonCollaborator,
} from "./hackathon";

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

test("hackathon registrations accept empty persisted responses", async () => {
  setAuthTokenGetter(() => "jwt-hackathon");
  const fetchMock = vi.fn(async () => response({ registrations: [] }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(fetchHackathonRegistrations()).resolves.toEqual([]);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/hackathons/registrations",
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer jwt-hackathon" }),
    }),
  );
});

test("collaborator invitations write to the persisted team invitation endpoint", async () => {
  const fetchMock = vi.fn(async () => response({
    invitation: {
      id: "hackinvite_1",
      hackathonId: "hack_1",
      teamId: "team_1",
      collaboratorId: "user_2",
      role: "Backend Engineer",
      status: "pending",
      createdAt: "2026-07-15T00:00:00.000Z",
      updatedAt: "2026-07-15T00:00:00.000Z",
    },
  }));
  vi.stubGlobal("fetch", fetchMock);

  const invitation = await inviteHackathonCollaborator(
    "hack_1",
    "team_1",
    "user_2",
    "Backend Engineer",
  );

  expect(invitation.status).toBe("pending");
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/hackathons/hack_1/teams/team_1/invitations",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ collaboratorId: "user_2", role: "Backend Engineer" }),
    }),
  );
});
