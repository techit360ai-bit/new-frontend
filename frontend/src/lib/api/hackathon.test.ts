import { afterEach, expect, test, vi } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  createOrganizerHackathon,
  fetchHackathonLeaderboard,
  fetchHackathonOverview,
  fetchHackathonPipeline,
  fetchOrganizerHackathons,
  fetchOrganizerHackathon,
  fetchHackathonRegistrations,
  fetchHackathonVelocity,
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

test("organizer hackathons list persisted events without static opportunity records", async () => {
  setAuthTokenGetter(() => "jwt-organization");
  const fetchMock = vi.fn(async () => response({
    hackathons: [{
      id: "hack_organizer",
      title: "Persisted Build Week",
      theme: "Ship a production workflow",
      visibility: "public",
      status: "upcoming",
      hackathonStatus: "upcoming",
      startDate: "2026-08-01",
      endDate: "2026-08-03",
      durationHours: 48,
      registrants: 0,
      teamsFormed: 0,
      stillSolo: 0,
      prizes: [],
      partners: [],
      judgingDimensions: [],
    }],
  }));
  vi.stubGlobal("fetch", fetchMock);

  const rows = await fetchOrganizerHackathons();

  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    id: "hack_organizer",
    title: "Persisted Build Week",
    registrants: 0,
    teamsFormed: 0,
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/hackathons?scope=owned",
    expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Authorization: "Bearer jwt-organization" }),
    }),
  );
});

test("organizer hackathon publishing persists the complete configured payload", async () => {
  const input = {
    title: "Live Build Week",
    theme: "Build useful software",
    summary: "Build useful software",
    visibility: "public" as const,
    status: "upcoming" as const,
    hackathonStatus: "upcoming" as const,
    applyDeadline: "2026-08-01",
    startDate: "2026-08-01",
    endDate: "2026-08-03",
    durationHours: 48,
    prizePool: "$5,000",
    eligibility: "Open to verified builders",
    prizes: [{ rank: "1st place", amount: "$5,000" }],
    judgingDimensions: ["problem_clarity", "technical_execution", "commercial_viability"],
    partners: ["Live Partner"],
    mentorPool: 5,
    organizerName: "Live Organization",
  };
  const fetchMock = vi.fn(async () => response({
    hackathon: {
      id: "hack_created",
      ...input,
      registrants: 0,
      teamsFormed: 0,
      stillSolo: 0,
    },
  }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(createOrganizerHackathon(input)).resolves.toMatchObject({
    id: "hack_created",
    title: "Live Build Week",
    eligibility: "Open to verified builders",
    mentorPool: 5,
  });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/hackathons",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
});

test("organizer hackathon detail reads persisted metadata and aggregate endpoints", async () => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.endsWith("/overview")) {
      return response({
        hackathonId: "hack_detail",
        status: "live",
        registrants: 3,
        teamsFormed: 1,
        stillSolo: 0,
        ideaSubmissions: 1,
        totalTeams: 1,
        avgBuildVelocity: 72,
      });
    }
    if (url.endsWith("/velocity")) {
      return response({ teams: [{ teamId: "team_1", name: "Persisted Team", activityScore: 72 }] });
    }
    if (url.endsWith("/leaderboard")) {
      return response({ leaderboard: [{ teamId: "team_1", name: "Persisted Team", composite: 81 }] });
    }
    if (url.endsWith("/pipeline")) {
      return response({ buckets: { incubationInvites: 1, prototypeTrack: 0, backToLearning: 0 } });
    }
    return response({
      hackathon: {
        id: "hack_detail",
        title: "Persisted Detail",
        type: "hackathon",
        status: "live",
        hackathonStatus: "live",
        prizes: [],
        partners: [],
        judgingDimensions: [],
      },
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  const [event, overview, velocity, leaderboard, pipeline] = await Promise.all([
    fetchOrganizerHackathon("hack_detail"),
    fetchHackathonOverview("hack_detail"),
    fetchHackathonVelocity("hack_detail"),
    fetchHackathonLeaderboard("hack_detail"),
    fetchHackathonPipeline("hack_detail"),
  ]);

  expect(event).toMatchObject({ id: "hack_detail", title: "Persisted Detail" });
  expect(overview).toMatchObject({ registrants: 3, totalTeams: 1 });
  expect(velocity).toEqual([{ teamId: "team_1", name: "Persisted Team", activity: 72 }]);
  expect(leaderboard).toMatchObject([{ teamId: "team_1", composite: 81 }]);
  expect(pipeline).toEqual({ incubationInvites: 1, prototypeTrack: 0, backToLearning: 0 });
  expect(fetchMock.mock.calls).toHaveLength(5);
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
