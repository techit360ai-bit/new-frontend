import { test, expect } from "vitest";
import { emptyStore, applyEnvelope, inTribe, type MsgStore } from "./wsReducer";

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

test("inTribe: own role matches", () => {
  expect(inTribe({ authorRole: "collaborator", audience: ["all"] }, "collaborator")).toBe(true);
});
test("inTribe: targeted audience matches", () => {
  expect(inTribe({ authorRole: "organisation", audience: ["collaborator"] }, "collaborator")).toBe(true);
});
test("inTribe: unrelated does not match", () => {
  expect(inTribe({ authorRole: "founder", audience: ["all"] }, "collaborator")).toBe(false);
});

test("post.new routes into global always and tribe conditionally", () => {
  let s = emptyStore();
  s = applyEnvelope(s, { type: "post.new", id: "e", ts: "t", data: { id: "p1", authorId: "o", authorRole: "organisation", audience: ["collaborator"], kind: "opportunity", body: "x", ts: "t" } }, "collaborator");
  expect(s.feed[0]?.id).toBe("p1");        // global
  expect(s.tribe[0]?.id).toBe("p1");       // tribe (targeted)
  let s2 = emptyStore();
  s2 = applyEnvelope(s2, { type: "post.new", id: "e", ts: "t", data: { id: "p2", authorId: "f", authorRole: "founder", audience: ["all"], kind: "update", body: "y", ts: "t" } }, "collaborator");
  expect(s2.feed[0]?.id).toBe("p2");       // global
  expect(s2.tribe.length).toBe(0);         // not in tribe
});
