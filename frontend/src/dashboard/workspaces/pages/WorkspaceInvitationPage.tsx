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
      const message = acceptError instanceof Error ? acceptError.message : "Invitation could not be accepted.";
      toast.error(message.includes("free_collaborator_workspace_limit") ? "Free Collaborator accounts can join one workspace. Upgrade or leave the current workspace to accept this invitation." : message);
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

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-600" /></div>;
  if (error || !invitation) return <div className="mx-auto mt-16 max-w-lg rounded-xl border border-status-error bg-status-error-soft p-8 text-center text-sm text-status-error">{error || "Invitation not found."}</div>;

  const actionable = invitation.status === "pending";
  return (
    <main className="min-h-screen bg-background-primary px-4 py-12">
      <section className="mx-auto max-w-2xl rounded-2xl border border-border-default bg-surface-primary p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-violet-100 p-3"><Users className="h-6 w-6 text-violet-700" /></div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-700">Workspace invitation</p>
            <h1 className="mt-1 text-2xl font-bold text-text-primary">Join {invitation.workspaceName}</h1>
            <p className="mt-1 text-sm text-text-muted">{invitation.inviterName} invited you as {invitation.requestedRole}.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-border-default bg-background-primary p-5">
          <Detail label="Scope" value={invitation.scope} />
          <Detail label="Skills" value={invitation.requiredSkills.join(", ") || "No specific skills listed"} />
          <Detail label="Workspace access" value={invitation.accessLevel === "contributor" ? "Contributor - tasks and reports" : "Viewer - read only"} />
          <Detail label="Proposed ownership" value={invitation.equityProposal > 0 ? `${invitation.equityProposal}%` : "Cash-only exception"} />
          {invitation.cashReward > 0 && <Detail label="Optional cash support" value={`$${invitation.cashReward.toLocaleString()}/month`} />}
        </div>

        <div className="mt-5 flex gap-2 rounded-lg bg-status-warning-soft p-3 text-xs text-amber-900">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <p>Accepting grants workspace access only. Ownership, vesting and contract terms remain proposals until separately signed.</p>
        </div>

        {actionable ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button disabled={busy !== null} onClick={() => void decline()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm font-semibold text-text-secondary disabled:opacity-50"><XCircle className="h-4 w-4" /> Decline</button>
            <button disabled={busy !== null} onClick={() => void accept()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === "accept" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept and join</button>
          </div>
        ) : (
          <p className="mt-6 rounded-lg border border-border-default p-3 text-center text-sm font-semibold text-text-secondary">Invitation {invitation.status}.</p>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{value}</p></div>;
}
