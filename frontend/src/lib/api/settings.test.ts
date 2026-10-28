import { afterEach, expect, test, vi } from "vitest";
import { setAuthTokenGetter } from "./client";
import {
  fetchNotificationPreferences,
  saveNotificationPreferences,
} from "./settings";

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

test("notification settings read the authenticated domain preference endpoint", async () => {
  setAuthTokenGetter(() => "jwt-settings");
  const fetchMock = vi.fn(async () => response({
    preferences: { founder: { quietHours: "weekends" } },
  }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(fetchNotificationPreferences("founder")).resolves.toEqual({ quietHours: "weekends" });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/notifications/preferences",
    expect.objectContaining({
      method: "GET",
      headers: expect.objectContaining({ Authorization: "Bearer jwt-settings" }),
    }),
  );
});

test("notification settings persist exact preference payloads", async () => {
  const preferences = {
    opportunities: { email: true, inApp: false },
    quietHours: "off",
  };
  const fetchMock = vi.fn(async () => response({ preferences: { collaborator: preferences } }));
  vi.stubGlobal("fetch", fetchMock);

  await expect(saveNotificationPreferences("collaborator", preferences)).resolves.toEqual(preferences);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/api/domain/notifications/preferences",
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ scope: "collaborator", preferences }),
    }),
  );
});
