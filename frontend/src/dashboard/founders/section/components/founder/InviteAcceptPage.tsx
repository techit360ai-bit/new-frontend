import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Copy, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useFounderProfile } from "@/contexts/UserContext";
import type { Hackathon } from "@/dashboard/_shared/opportunities/types";
import { ApiError } from "@/lib/api/client";
import { acceptHackathonInvite, fetchHackathonInvite } from "@/lib/api/hackathon";
import { normalizePublishedHackathon } from "@/lib/api/opportunities";

type InviteState =
  | { kind: "loading" }
  | { kind: "ok"; hackathon: Hackathon; teamName: string; leaderName: string; openRoles: string[]; invitedRole: string; memberCount: number; teamSize: number }
  | { kind: "leader"; hackathonId: string; teamId: string; inviteToken: string }
  | { kind: "token-mismatch" }
  | { kind: "not-found" }
  | { kind: "team-full"; hackathonId: string }
  | { kind: "roster-closed" }
  | { kind: "hackathon-missing" };

export default function InviteAcceptPage() {
  const { hackathonId, teamId } = useParams<{ hackathonId: string; teamId: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { registerForHackathon } = useFounderProfile();
  const [state, setState] = useState<InviteState>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    if (!hackathonId || !teamId || !token) {
      setState({ kind: "not-found" });
      return;
    }
    setState({ kind: "loading" });
    fetchHackathonInvite(hackathonId, teamId, token)
      .then((invite) => {
        if (!alive) return;
        const hackathon = normalizePublishedHackathon(invite.hackathon);
        if (!hackathon) {
          setState({ kind: "hackathon-missing" });
        } else if (invite.isLeader) {
          setState({ kind: "leader", hackathonId, teamId, inviteToken: token });
        } else if (invite.rosterClosed) {
          setState({ kind: "roster-closed" });
        } else if (invite.memberCount >= invite.teamSize) {
          setState({ kind: "team-full", hackathonId });
        } else {
          setState({
            kind: "ok",
            hackathon,
            teamName: invite.teamName,
            leaderName: invite.leaderName,
            openRoles: invite.openRoles,
            invitedRole: invite.invitedRole ?? "",
            memberCount: invite.memberCount,
            teamSize: invite.teamSize,
          });
        }
      })
      .catch((error) => {
        if (!alive) return;
        const code = error instanceof ApiError
          ? String((error.body as { error?: string } | null)?.error || "")
          : "";
        setState(code === "invite_token_invalid" ? { kind: "token-mismatch" } : { kind: "not-found" });
      });
    return () => { alive = false; };
  }, [hackathonId, teamId, token]);

  if (state.kind === "loading") {
    return (
      <Wrapper>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading live team invite...</p>
      </Wrapper>
    );
  }

  if (state.kind === "leader") {
    const url = `https://techit.ai/h/${state.hackathonId}/team/${state.teamId}?token=${state.inviteToken}`;
    return (
      <Wrapper>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">You're the leader of this team</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-normal">
          Share this invite link with collaborators instead of clicking it yourself.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input
            readOnly
            value={url}
            className="flex-1 text-xs px-3.5 py-2 border border-black/[0.08] dark:border-white/10 rounded-xl bg-black/[0.03] dark:bg-black/40 text-slate-800 dark:text-slate-200 outline-none"
          />
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(url); toast.success("Invite link copied"); }}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5 text-[#0066ff] dark:text-[#58a6ff]" /> Copy
          </button>
        </div>
        <Link to="/incubation-hub?panel=hackathon" className="inline-block mt-6 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
          ← Back to your hackathon panel
        </Link>
      </Wrapper>
    );
  }

  if (state.kind === "ok") {
    return (
      <AcceptForm
        state={state}
        hackathonId={hackathonId!}
        teamId={teamId!}
        token={token}
        registerForHackathon={registerForHackathon}
        navigate={navigate}
      />
    );
  }

  const messages: Record<Exclude<InviteState["kind"], "ok" | "leader" | "loading">, { title: string; body: React.ReactNode }> = {
    "token-mismatch":     { title: "This invite link is invalid or has expired.", body: <BackLink to="/opportunity-hub" /> },
    "not-found":          { title: "We can't find that team.", body: <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">The invite link may be from a hackathon you're not signed in for. <BackLink to="/opportunity-hub" /></p> },
    "team-full":          { title: "This team is already full.", body: <Link to={`/opportunity-hub/${(state as { hackathonId: string }).hackathonId}`} className="inline-block mt-4 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">Find another team in the hackathon →</Link> },
    "roster-closed":      { title: "This team's roster is closed.", body: <BackLink to="/opportunity-hub" /> },
    "hackathon-missing":  { title: "This hackathon is no longer available.", body: <BackLink to="/opportunity-hub" /> },
  };
  const m = messages[state.kind];
  return (
    <Wrapper>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{m.title}</h1>
      {m.body}
    </Wrapper>
  );
}

function AcceptForm({
  state,
  hackathonId,
  teamId,
  token,
  registerForHackathon,
  navigate,
}: {
  state: Extract<InviteState, { kind: "ok" }>;
  hackathonId: string;
  teamId: string;
  token: string;
  registerForHackathon: ReturnType<typeof useFounderProfile>["registerForHackathon"];
  navigate: (path: string) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<string>(
    state.invitedRole || state.openRoles[0] || "",
  );
  const [joining, setJoining] = useState(false);
  const handleJoin = async () => {
    if (!selectedRole) return;
    setJoining(true);
    try {
      const registration = await acceptHackathonInvite(
        hackathonId,
        teamId,
        token,
        selectedRole,
      );
      if (!registration) {
        toast.error("The team membership was not persisted.");
        return;
      }
      registerForHackathon(registration);
      toast.success(`Joined ${state.teamName} for ${state.hackathon.title}.`);
      navigate("/incubation-hub?panel=hackathon");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The invite could not be accepted.");
    } finally {
      setJoining(false);
    }
  };
  const handleDecline = () => {
    toast.info("Invite declined.");
    navigate("/opportunity-hub");
  };
  return (
    <Wrapper>
      <p className="text-xs text-[#0066ff] dark:text-[#58a6ff] uppercase tracking-wider font-bold">You're invited to join</p>
      <div className="flex items-center gap-3.5 mt-2">
        <span className="text-3xl" aria-hidden="true">{state.hackathon.poster}</span>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{state.hackathon.title}</h1>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{state.hackathon.organizer.name} · {state.hackathon.startDate} → {state.hackathon.endDate}</p>
        </div>
      </div>
      <hr className="my-5 border-black/[0.06] dark:border-white/10" />
      <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-bold">Team</p>
      <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">{state.teamName}</h2>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Led by {state.leaderName}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-bold uppercase tracking-wider">
        Members ({state.memberCount} of {state.teamSize}) · {state.openRoles.length} role{state.openRoles.length === 1 ? "" : "s"} open
      </p>
      <ul className="mt-2 space-y-2">
        {state.openRoles.map((r) => (
          <li key={r} className="text-sm font-medium text-slate-700 dark:text-slate-300 border border-dashed border-black/[0.08] dark:border-white/15 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl px-3.5 py-2 flex items-center gap-2">
            <span className="text-[#0066ff] dark:text-[#58a6ff]">○</span> {r}
          </li>
        ))}
      </ul>
      <hr className="my-5 border-black/[0.06] dark:border-white/10" />
      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Choose your role</label>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        disabled={state.openRoles.length === 1}
        className="w-full px-3.5 py-2.5 border border-black/[0.08] dark:border-white/10 rounded-xl text-sm bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white outline-none focus:border-[#0066ff] focus:ring-2 focus:ring-[#0066ff]/20 transition-all"
      >
        {state.openRoles.map((r) => (<option key={r} value={r} className="bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white">{r}</option>))}
      </select>
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={handleDecline}
          className="text-sm font-semibold px-4 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={!selectedRole || joining}
          className="text-sm font-bold px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0066ff] to-[#58a6ff] hover:from-[#0052cc] hover:to-[#408fe6] text-white shadow-[0_4px_15px_rgba(0,102,255,0.25)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {joining ? "Joining..." : "Join team & continue →"}
        </button>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6 min-h-[70vh] flex items-center justify-center">
      <div className="max-w-xl w-full mx-auto">
        <Link to="/opportunity-hub" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunity Hub
        </Link>
        <div className="border border-black/[0.06] dark:border-white/10 rounded-2xl bg-white/80 dark:bg-[#121212]/90 backdrop-blur-xl p-8 shadow-[0_10px_30px_rgba(0,0,0,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
          {children}
        </div>
      </div>
    </div>
  );
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-block mt-4 text-sm font-semibold text-[#0066ff] dark:text-[#58a6ff] hover:underline">
      ← Back to Opportunity Hub
    </Link>
  );
}
