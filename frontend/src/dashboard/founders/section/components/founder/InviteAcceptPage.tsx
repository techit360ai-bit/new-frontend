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
        <p className="text-sm text-slate-500">Loading live team invite...</p>
      </Wrapper>
    );
  }

  if (state.kind === "leader") {
    const url = `https://techit.ai/h/${state.hackathonId}/team/${state.teamId}?token=${state.inviteToken}`;
    return (
      <Wrapper>
        <h1 className="text-xl font-semibold text-slate-900">You're the leader of this team</h1>
        <p className="text-sm text-slate-600 mt-2">
          Share this invite link with collaborators instead of clicking it yourself.
        </p>
        <div className="flex items-center gap-2 mt-4">
          <input readOnly value={url} className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700" />
          <button
            type="button"
            onClick={() => { navigator.clipboard.writeText(url); toast.success("Invite link copied"); }}
            className="text-xs font-medium px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
        <Link to="/incubation-hub?panel=hackathon" className="inline-block mt-6 text-sm font-medium text-violet-700 hover:underline">
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
    "not-found":          { title: "We can't find that team.", body: <p className="text-sm text-slate-600 mt-2">The invite link may be from a hackathon you're not signed in for. <BackLink to="/opportunity-hub" /></p> },
    "team-full":          { title: "This team is already full.", body: <Link to={`/opportunity-hub/${(state as { hackathonId: string }).hackathonId}`} className="inline-block mt-4 text-sm font-medium text-violet-700 hover:underline">Find another team in the hackathon →</Link> },
    "roster-closed":      { title: "This team's roster is closed.", body: <BackLink to="/opportunity-hub" /> },
    "hackathon-missing":  { title: "This hackathon is no longer available.", body: <BackLink to="/opportunity-hub" /> },
  };
  const m = messages[state.kind];
  return (
    <Wrapper>
      <h1 className="text-xl font-semibold text-slate-900">{m.title}</h1>
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
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">You're invited to join</p>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-3xl" aria-hidden="true">{state.hackathon.poster}</span>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{state.hackathon.title}</h1>
          <p className="text-xs text-slate-500">{state.hackathon.organizer.name} · {state.hackathon.startDate} → {state.hackathon.endDate}</p>
        </div>
      </div>
      <hr className="my-5 border-slate-200" />
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Team</p>
      <h2 className="text-base font-semibold text-slate-900 mt-1">{state.teamName}</h2>
      <p className="text-xs text-slate-500 mt-0.5">Led by {state.leaderName}</p>
      <p className="text-xs text-slate-500 mt-3 font-medium uppercase tracking-wider">
        Members ({state.memberCount} of {state.teamSize}) · {state.openRoles.length} role{state.openRoles.length === 1 ? "" : "s"} open
      </p>
      <ul className="mt-2 space-y-1.5">
        {state.openRoles.map((r) => (
          <li key={r} className="text-sm text-slate-700 border border-dashed border-slate-200 rounded-lg px-3 py-2">○ {r}</li>
        ))}
      </ul>
      <hr className="my-5 border-slate-200" />
      <label className="block text-xs font-medium text-slate-700 uppercase tracking-wider mb-1.5">Choose your role</label>
      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value)}
        disabled={state.openRoles.length === 1}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
      >
        {state.openRoles.map((r) => (<option key={r} value={r}>{r}</option>))}
      </select>
      <div className="flex items-center justify-between gap-3 mt-6">
        <button type="button" onClick={handleDecline} className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
          Decline
        </button>
        <button
          type="button"
          onClick={() => void handleJoin()}
          disabled={!selectedRole || joining}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:bg-slate-300"
        >
          {joining ? "Joining..." : "Join team & continue →"}
        </button>
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <div className="max-w-xl mx-auto">
        <Link to="/opportunity-hub" className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Opportunity Hub
        </Link>
        <div className="border border-slate-200 rounded-xl bg-white p-6">{children}</div>
      </div>
    </div>
  );
}

function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-block mt-4 text-sm font-medium text-violet-700 hover:underline">
      ← Back to Opportunity Hub
    </Link>
  );
}
