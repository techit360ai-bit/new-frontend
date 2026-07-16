import { expect, test, vi } from "vitest";
import { persistOnboardingCompletion } from "./onboarding";

test("onboarding completion persists the canonical profile flag", async () => {
  const updateProfile = vi.fn(async () => ({ error: null }));

  await persistOnboardingCompletion(updateProfile);

  expect(updateProfile).toHaveBeenCalledWith({ isOnboarded: true });
});

test("onboarding completion blocks navigation when persistence fails", async () => {
  const failure = new Error("Profile update failed");
  const updateProfile = vi.fn(async () => ({ error: failure }));
  let caught: unknown;

  try {
    await persistOnboardingCompletion(updateProfile);
  } catch (error) {
    caught = error;
  }

  expect(caught).toBe(failure);
});
