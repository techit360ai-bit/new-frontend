import { test, expect } from "vitest";
import { canTransition } from "./transitions";

test("canTransition follows the demo state machine", () => {
  expect(canTransition("draft", "scheduled")).toBe(true);
  expect(canTransition("live", "ended")).toBe(true);
  expect(canTransition("ended", "live")).toBe(false);
  expect(canTransition("draft", "live")).toBe(false);
});
