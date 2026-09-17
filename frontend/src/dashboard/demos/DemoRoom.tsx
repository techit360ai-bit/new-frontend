import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Video, Radio, MessageSquare, ThumbsUp, CheckCircle2, Shield, UserPlus, ExternalLink, Sparkles } from "lucide-react";
import { getEvent, transitionStatus, invite, respondInvite } from "@/lib/demo/client";
import { canTransition } from "@/lib/demo/transitions";
import { fetchRtcToken, type RtcSession } from "@/lib/demo/rtc";
import { useMessaging } from "@/contexts/MessagingProvider";
import { listQuestions, askQuestion, upvoteQuestion, resolveQuestion, type Question } from "@/lib/demo/qa";
import type { DemoEvent } from "@/lib/demo/types";

const DemoStage = lazy(() => import("./DemoStage"));

const ROOM_ROLES = ["presenter", "judge", "audience"];

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20",
  scheduled: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  live: "bg-[#20C997]/10 text-[#20C997] border border-[#20C997]/20 font-bold",
  ended: "bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
};

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

  if (loading) return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-8 justify-center">
      <div className="w-4 h-4 border-2 border-[#20C997] border-t-transparent rounded-full animate-spin" />
      <span>Loading demo room...</span>
    </div>
  );

  if (!event) return (
    <div className="p-8 max-w-2xl mx-auto text-xs text-slate-500 dark:text-slate-400 font-bricolage text-center">
      <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Demo not found or unavailable.</p>
      <Link to="/demos" className="text-[#20C997] hover:underline font-bold">
        ← Back to Demo Rooms
      </Link>
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 font-bricolage animate-in fade-in duration-300">
      <Link
        to="/demos"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>All Demo Rooms</span>
      </Link>

      <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{event.title}</h1>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold ${STATUS_STYLE[event.status] ?? "bg-slate-500/10 text-slate-500 border border-slate-500/20"}`}>
                {event.status === "live" && <Radio className="w-2.5 h-2.5 inline mr-1 animate-pulse" />}
                {event.status}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 capitalize">
              {event.kind} demo · Host ID: {event.hostId || "System"}
            </p>
          </div>
        </div>
        {event.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            {event.description}
          </p>
        )}
        {event.assetUrl && (
          <a
            href={event.assetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-[#20C997] hover:underline"
          >
            <span>View Attached Asset</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Live stage */}
      {event.status === "live" && (
        session ? (
          <Suspense fallback={
            <div className="flex items-center gap-2 text-xs text-slate-400 p-6 justify-center">
              <div className="w-4 h-4 border-2 border-[#20C997] border-t-transparent rounded-full animate-spin" />
              <span>Connecting live video stage...</span>
            </div>
          }>
            <DemoStage session={session} />
          </Suspense>
        ) : (
          <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 text-xs text-slate-500 dark:text-slate-400 text-center">
            Live video stage is currently initializing or unavailable.
          </div>
        )
      )}

      {/* Audience Q&A */}
      <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4 text-[#20C997]" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Audience Q&amp;A</h2>
        </div>

        {event.status === "live" ? (
          <div className="flex items-center gap-2 mb-5">
            <input
              value={qBody}
              onChange={(e) => setQBody(e.target.value)}
              placeholder="Ask a question…"
              onKeyDown={(e) => { if (e.key === "Enter") void submitQuestion(); }}
              className="flex-1 h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3.5 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
            />
            <button
              type="button"
              disabled={!qBody.trim()}
              onClick={() => void submitQuestion()}
              className="h-10 px-4 text-xs font-bold text-slate-950 bg-[#20C997] hover:bg-[#1db587] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              Ask
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-4">Questions open when the demo room goes live.</p>
        )}

        {questions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No questions submitted yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {questions.map((q) => (
              <li
                key={q.id}
                className={`flex items-start gap-3 text-xs rounded-xl border p-3.5 transition-all ${
                  q.state === "dismissed"
                    ? "opacity-50 line-through border-black/[0.04] dark:border-white/[0.04]"
                    : q.state === "answered"
                      ? "border-[#20C997]/30 bg-[#20C997]/[0.04]"
                      : "border-black/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]"
                }`}
              >
                <button
                  type="button"
                  disabled={event.status !== "live"}
                  onClick={() => void toggleVote(q.id)}
                  className={`flex flex-col items-center px-2 py-1 rounded-lg border transition-colors ${
                    q.mine
                      ? "border-[#20C997]/40 bg-[#20C997]/10 text-[#20C997]"
                      : "border-black/[0.06] dark:border-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  } disabled:opacity-40`}
                >
                  <span className="text-[10px]">▲</span>
                  <span className="text-xs font-extrabold">{q.votes}</span>
                </button>
                <span className="flex-1 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">{q.body}</span>
                {canModerate && q.state === "open" && event.status === "live" && (
                  <span className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void setQState(q.id, "answered")}
                      className="text-[11px] font-bold text-[#20C997] hover:underline"
                    >
                      Answered
                    </button>
                    <button
                      type="button"
                      onClick={() => void setQState(q.id, "dismissed")}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:underline"
                    >
                      Dismiss
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Host Controls</h2>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.length === 0 && <span className="text-xs text-slate-500 dark:text-slate-400 italic">No status transitions available.</span>}
            {nextStatuses.map((s) => (
              <button
                key={s}
                type="button"
                disabled={busy}
                onClick={() => act(() => transitionStatus(id, s))}
                className="text-xs font-bold px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 transition-colors disabled:opacity-40 capitalize"
              >
                Move to {s}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/10">
            <div className="flex-1 min-w-[10rem]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Invite User ID
              </span>
              <input
                value={inviteUser}
                onChange={(e) => setInviteUser(e.target.value)}
                placeholder="User ID or handle"
                className="w-full h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997]"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="h-10 border border-black/[0.08] dark:border-white/10 rounded-xl px-3 text-xs font-semibold bg-slate-50 dark:bg-white/[0.03] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#20C997]/20 focus:border-[#20C997] capitalize"
            >
              {ROOM_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <button
              type="button"
              disabled={busy || !inviteUser.trim()}
              onClick={() => act(async () => { await invite(id, inviteUser.trim(), inviteRole); setInviteUser(""); })}
              className="h-10 px-4 text-xs font-bold text-slate-950 bg-[#20C997] hover:bg-[#1db587] disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              Invite
            </button>
          </div>
        </div>
      )}

      {/* Invitee response */}
      {!isHost && mine && mine.status === "invited" && (
        <div className="border border-amber-500/20 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xs text-amber-800 dark:text-amber-300 flex-1">
            You're invited to this demo as <strong className="font-bold">{mine.roomRole}</strong>.
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => respondInvite(id, true))}
            className="text-xs font-bold text-slate-950 bg-[#20C997] hover:bg-[#1db587] px-3.5 py-1.5 rounded-xl transition-all"
          >
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => act(() => respondInvite(id, false))}
            className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-3 py-1.5"
          >
            Decline
          </button>
        </div>
      )}

      {/* Roster */}
      <div className="border border-black/[0.06] dark:border-white/10 bg-white dark:bg-[#111111] backdrop-blur-xl rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Room Roster</h2>
        {(event.roster ?? []).length === 0 ? (
          <p className="text-xs text-slate-400 italic">No participants registered in roster yet.</p>
        ) : (
          <ul className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            {(event.roster ?? []).map((r) => (
              <li key={r.userId} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">{r.userId}</span>
                <span className="text-slate-500 dark:text-slate-400 capitalize font-medium">
                  {r.roomRole} · <span className="text-[#20C997]">{r.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
