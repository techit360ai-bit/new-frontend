import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, transitionStatus, invite, respondInvite } from "@/lib/demo/client";
import { canTransition } from "@/lib/demo/transitions";
import { fetchRtcToken, type RtcSession } from "@/lib/demo/rtc";
import { useMessaging } from "@/contexts/MessagingProvider";
import { listQuestions, askQuestion, upvoteQuestion, resolveQuestion, type Question } from "@/lib/demo/qa";
import type { DemoEvent } from "@/lib/demo/types";

const DemoStage = lazy(() => import("./DemoStage"));

const ROOM_ROLES = ["presenter", "judge", "audience"];

function currentUserId(): string {
  try {
    const u = localStorage.getItem("techit_user");
    return u ? (JSON.parse(u).id ?? "") : "";
  } catch { return ""; }
}

export function DemoRoom() {
  const { id = "" } = useParams();
  const me = currentUserId();
  const [event, setEvent] = useState<DemoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteUser, setInviteUser] = useState("");
  const [inviteRole, setInviteRole] = useState("judge");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<RtcSession | null>(null);
  const { store } = useMessaging();
  const [seed, setSeed] = useState<Question[]>([]);
  const [qBody, setQBody] = useState("");

  const refresh = useCallback(() => {
    return getEvent(id).then((e) => { setEvent(e); setLoading(false); });
  }, [id]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (event?.status !== "live") { setSession(null); return; }
    let alive = true;
    fetchRtcToken(id).then((s) => { if (alive) setSession(s); });
    return () => { alive = false; };
  }, [event?.status, id]);

  // seed the question list once the event is visible
  useEffect(() => {
    if (!event) return;
    let alive = true;
    listQuestions(id).then((qs) => { if (alive) setSeed(qs); });
    return () => { alive = false; };
  }, [event, id]);

  if (loading) return <div className="p-8 text-sm text-slate-400">Loading…</div>;
  if (!event) return (
    <div className="p-8 max-w-2xl mx-auto text-slate-500">
      Demo not found or unavailable. <Link to="/demos" className="text-violet-600 hover:underline">Back to demos</Link>
    </div>
  );

  const isHost = !!me && event.hostId === me;
  const mine = (event.roster ?? []).find((r) => r.userId === me);
  const nextStatuses = (["scheduled", "live", "ended", "cancelled"] as const).filter((s) => canTransition(event.status, s));

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try { await fn(); await refresh(); } finally { setBusy(false); }
  };

  // merge REST seed with live wsReducer deltas (live wins on id collision)
  const live = store.questions[id] ?? [];
  const byId = new Map<string, Question>();
  for (const q of seed) byId.set(q.id, q);
  for (const lq of live) {
    const existing = byId.get(lq.id);
    byId.set(lq.id, {
      id: lq.id, eventId: id, askerId: lq.askerId, body: lq.body,
      state: lq.state, votes: lq.votes, mine: existing?.mine ?? false, createdAt: lq.createdAt,
    });
  }
  const questions = Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const submitQuestion = async () => {
    const body = qBody.trim();
    if (!body) return;
    const created = await askQuestion(id, body);
    if (created) setSeed((prev) => [...prev, created]);
    setQBody("");
  };
  const toggleVote = async (qid: string) => {
    const res = await upvoteQuestion(id, qid);
    if (res) setSeed((prev) => prev.map((q) => (q.id === qid ? { ...q, votes: res.votes, mine: res.mine } : q)));
  };
  const setQState = async (qid: string, state: "answered" | "dismissed") => {
    const updated = await resolveQuestion(id, qid, state);
    if (updated) setSeed((prev) => prev.map((q) => (q.id === qid ? { ...q, state: updated.state } : q)));
  };
  const canModerate = isHost || (mine?.roomRole === "presenter");

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <Link to="/demos" className="text-xs text-violet-600 hover:underline">← All demos</Link>

      <div className="border border-slate-200 bg-white rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{event.title}</h1>
            <p className="text-sm text-slate-500 capitalize mt-0.5">{event.kind} demo · {event.status}</p>
          </div>
        </div>
        {event.description && <p className="text-sm text-slate-600 mt-3">{event.description}</p>}
        {event.assetUrl && (
          <a href={event.assetUrl} target="_blank" rel="noreferrer" className="inline-block mt-3 text-sm text-violet-600 hover:underline">
            View asset →
          </a>
        )}
      </div>

      {/* Live stage */}
      {event.status === "live" && (
        session ? (
          <Suspense fallback={<div className="text-sm text-slate-400">Connecting live video…</div>}>
            <DemoStage session={session} />
          </Suspense>
        ) : (
          <div className="border border-slate-200 bg-white rounded-xl p-6 text-sm text-slate-500">
            Live video is unavailable right now.
          </div>
        )
      )}

      {/* Audience Q&A */}
      <div className="border border-slate-200 bg-white rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Audience Q&amp;A</h2>
        {event.status === "live" ? (
          <div className="flex items-end gap-2 mb-4">
            <input value={qBody} onChange={(e) => setQBody(e.target.value)} placeholder="Ask a question…"
              onKeyDown={(e) => { if (e.key === "Enter") void submitQuestion(); }}
              className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
            <button type="button" disabled={!qBody.trim()} onClick={() => void submitQuestion()}
              className="text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 px-3 py-1.5 rounded-lg">
              Ask
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mb-3">Questions open when the demo goes live.</p>
        )}
        {questions.length === 0 ? (
          <p className="text-xs text-slate-400">No questions yet.</p>
        ) : (
          <ul className="space-y-2">
            {questions.map((q) => (
              <li key={q.id} className={`flex items-start gap-3 text-sm rounded-lg border px-3 py-2 ${q.state === "dismissed" ? "opacity-50 line-through border-slate-100" : q.state === "answered" ? "border-emerald-200 bg-emerald-50" : "border-slate-200"}`}>
                <button type="button" disabled={event.status !== "live"} onClick={() => void toggleVote(q.id)}
                  className={`flex flex-col items-center px-2 py-0.5 rounded ${q.mine ? "text-violet-600" : "text-slate-400"} disabled:opacity-40`}>
                  <span className="text-xs">▲</span>
                  <span className="text-xs font-semibold">{q.votes}</span>
                </button>
                <span className="flex-1 text-slate-700">{q.body}</span>
                {canModerate && q.state === "open" && event.status === "live" && (
                  <span className="flex gap-1">
                    <button type="button" onClick={() => void setQState(q.id, "answered")}
                      className="text-[10px] font-medium text-emerald-700 hover:underline">Answered</button>
                    <button type="button" onClick={() => void setQState(q.id, "dismissed")}
                      className="text-[10px] font-medium text-slate-400 hover:underline">Dismiss</button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="border border-slate-200 bg-white rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Host controls</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.length === 0 && <span className="text-xs text-slate-400">No status changes available.</span>}
            {nextStatuses.map((s) => (
              <button key={s} type="button" disabled={busy} onClick={() => act(() => transitionStatus(id, s))}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 capitalize">
                Move to {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2 pt-2 border-t border-slate-100">
            <label className="flex-1 min-w-[10rem]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Invite user id</span>
              <input value={inviteUser} onChange={(e) => setInviteUser(e.target.value)} placeholder="user id"
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm" />
            </label>
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm capitalize">
              {ROOM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button type="button" disabled={busy || !inviteUser.trim()}
              onClick={() => act(async () => { await invite(id, inviteUser.trim(), inviteRole); setInviteUser(""); })}
              className="text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:bg-slate-300 px-3 py-1.5 rounded-lg">
              Invite
            </button>
          </div>
        </div>
      )}

      {/* Invitee response */}
      {!isHost && mine && mine.status === "invited" && (
        <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 flex items-center gap-3">
          <span className="text-sm text-amber-800 flex-1">You're invited as <strong>{mine.roomRole}</strong>.</span>
          <button type="button" disabled={busy} onClick={() => act(() => respondInvite(id, true))}
            className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded-lg">Accept</button>
          <button type="button" disabled={busy} onClick={() => act(() => respondInvite(id, false))}
            className="text-xs font-medium text-slate-600 hover:text-slate-800 px-3 py-1.5">Decline</button>
        </div>
      )}

      {/* Roster */}
      <div className="border border-slate-200 bg-white rounded-xl p-5">
        <h2 className="text-sm font-semibold text-slate-700 mb-3">Roster</h2>
        {(event.roster ?? []).length === 0 ? (
          <p className="text-xs text-slate-400">No participants yet.</p>
        ) : (
          <ul className="space-y-2">
            {(event.roster ?? []).map((r) => (
              <li key={r.userId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{r.userId}</span>
                <span className="text-xs text-slate-500 capitalize">{r.roomRole} · {r.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
