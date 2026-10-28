import { test, expect } from "vitest";
import { initials, mapMessage, mapConvSummary } from "./map";

test("initials derives up to two uppercase letters", () => {
  expect(initials("Sarah Kim")).toBe("SK");
  expect(initials("madonna")).toBe("M");
  expect(initials("")).toBe("?");
});

test("mapMessage marks fromMe and carries body/timestamp", () => {
  const m = mapMessage({ id: "m1", convId: "c1", senderId: "u2", type: "text", body: "hi", ts: "2026-06-10T00:00:00Z" }, "u1");
  expect(m.id).toBe("m1");
  expect(m.fromMe).toBe(false);
  expect(m.body).toBe("hi");
  expect(m.timestamp).toBe("2026-06-10T00:00:00Z");

  const mine = mapMessage({ id: "m2", convId: "c1", senderId: "u1", type: "text", body: "yo", ts: "2026-06-10T00:01:00Z" }, "u1");
  expect(mine.fromMe).toBe(true);
});

test("mapConvSummary builds a UI Conversation with derived avatar", () => {
  const c = mapConvSummary({ id: "c1", otherUserId: "u2", otherName: "Sarah Kim", lastBody: "hey", lastTs: "2026-06-10T00:00:00Z", lastMsgId: "m1", unread: 2 });
  expect(c.id).toBe("c1");
  expect(c.participantName).toBe("Sarah Kim");
  expect(c.participantAvatar).toBe("SK");
  expect(c.unread).toBe(true);
  expect(c.lastMessageId).toBe("m1");
  expect(c.thread).toEqual([]);
});
