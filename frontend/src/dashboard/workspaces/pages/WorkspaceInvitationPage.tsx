import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShieldCheck, Users, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
  fetchWorkspaceInvitation,
  type WorkspaceInvitation,
} from "@/lib/api/workspaces";

export function WorkspaceInvitationPage() {
  const { invitationId = "" } = useParams<{ invitationId: string }>();
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchWorkspaceInvitation(invitationId)
      .then((row) => { if (alive) setInvitation(row); })
      .catch((loadError) => {
        if (alive) setError(loadError instanceof Error ? loadError.message : "Invitation unavailable.");
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [invitationId]);

  const accept = async () => {
    if (!invitation) return;
    setBusy("accept");
    try {
      const accepted = await acceptWorkspaceInvitation(invitation.id);
      setInvitation(accepted);
      toast.success(`You joined ${accepted.workspaceName}.`);
      navigate(`/workspaces/copilot?ws=${encodeURIComponent(accepted.workspaceId)}&project=${encodeURIComponent(accepted.projectId || "")}`);
    } catch (acceptError) {
      toast.error(acceptError instanceof Error ? acceptError.message : "Invitation could not be accepted.");
    } finally {
      setBusy(null);
    }
  };

  const decline = async () => {
    if (!invitation) return;
    setBusy("decline");
    try {
      const declined = await declineWorkspaceInvitation(invitation.id);
      setInvitation(declined);
      toast("Invitation declined.");
    } catch (declineError) {
      toast.error(declineError instanceof Error ? declineError.message : "Invitation could not be declined.");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]"><Loader2 className="h-6 w-6 animate-spin text-[#20C997]" /></div>;
  if (error || !invitation) return <div className="mx-auto mt-16 max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center text-sm text-red-600 dark:text-red-400">{error || "Invitation not found."}</div>;

  const actionable = invitation.status === "pending";
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-white transition-colors px-4 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-black/[0.06] dark:border-white/10 bg-white/80 dark:bg-[#111111]/90 backdrop-blur-xl p-6 shadow-xl sm:p-8 text-slate-900 dark:text-white">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-[#20C997]/10 p-3 border border-[#20C997]/20"><Users className="h-6 w-6 text-[#20C997]" /></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#20C997]">Workspace invitation</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Join {invitation.workspaceName}</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{invitation.inviterName} invited you as {invitation.requestedRole}.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-black/[0.06] dark:border-white/10 bg-slate-100/50 dark:bg-white/5 p-5">
          <Detail label="Scope" value={invitation.scope} />
          <Detail label="Skills" value={invitation.requiredSkills.join(", ") || "No specific skills listed"} />
          <Detail label="Workspace access" value={invitation.accessLevel === "contributor" ? "Contributor - tasks and reports" : "Viewer - read only"} />
          <Detail label="Proposed ownership" value={invitation.equityProposal > 0 ? `${invitation.equityProposal}%` : "Cash-only exception"} />
          {invitation.cashReward > 0 && <Detail label="Optional cash support" value={`$${invitation.cashReward.toLocaleString()}/month`} />}
        </div>

        <div className="mt-5 flex gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
          <p>Accepting grants workspace access only. Ownership, vesting and contract terms remain proposals until separately signed.</p>
        </div>

        {actionable ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button disabled={busy !== null} onClick={() => void decline()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors disabled:opacity-50"><XCircle className="h-4 w-4" /> Decline</button>
            <button disabled={busy !== null} onClick={() => void accept()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#20C997] hover:bg-[#1db587] px-5 py-2.5 text-sm font-bold text-slate-950 shadow-md transition-all disabled:opacity-50">{busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept and join</button>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-black/[0.06] dark:border-white/10 p-3 text-center text-sm font-semibold text-slate-700 dark:text-slate-300">Invitation {invitation.status}.</p>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{value}</p></div>;
}
