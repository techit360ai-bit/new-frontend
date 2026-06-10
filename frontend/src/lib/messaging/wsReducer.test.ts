import { test, expect } from "vitest";
import { emptyStore, applyEnvelope, type MsgStore } from "./wsReducer";

const me = "u1";

test("message.new appends to the conversation thread", () => {
  let s: MsgStore = emptyStore();
  s = applyEnvelope(s, { type: "message.new", id: "e1", ts: "t", data: { id: "m1", convId: "c1", senderId: "u2", type: "text", body: "hi", ts: "t" } }, me);
  expect(s.threads["c1"]?.length).toBe(1);
  expect(s.threads["c1"][0].fromMe).toBe(false);
});

test("message.new appends channel messages by channelId", () => {
  let s: MsgStore = emptyStore();
  s = applyEnvelope(s, { type: "message.new", id: "e1", ts: "t", data: { id: "m1", channelId: "ch1", senderId: "u2", type: "text", body: "yo", ts: "t" } }, me);
  expect(s.channelThreads["ch1"]?.length).toBe(1);
});

test("presence.changed updates the online set", () => {
  let s: MsgStore = emptyStore();
  s = applyEnvelope(s, { type: "presence.changed", id: "e", ts: "t", data: { userId: "u2", online: true } }, me);
  expect(s.online["u2"]).toBe(true);
  s = applyEnvelope(s, { type: "presence.changed", id: "e", ts: "t", data: { userId: "u2", online: false } }, me);
  expect(s.online["u2"]).toBe(false);
});

test("post.new prepends to the feed", () => {
  let s: MsgStore = emptyStore();
  s = applyEnvelope(s, { type: "post.new", id: "e", ts: "t", data: { id: "p1", authorId: "u2", kind: "update", body: "shipped", ts: "t" } }, me);
  expect(s.feed[0]?.id).toBe("p1");
});

test("unknown envelope type is a no-op (same reference is fine)", () => {
  const s0 = emptyStore();
  const s1 = applyEnvelope(s0, { type: "totally.unknown", id: "e", ts: "t" }, me);
  expect(s1.feed.length).toBe(0);
});
