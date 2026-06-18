import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { buildTeamWorkspace } from "@/dashboard/_shared/hackathon/workspace";
import { provisionTeamWorkspace, reportTeamToOrganizers } from "@/lib/api/hackathon";

// The ONE create-workspace action (Build stage). Reuse-aware: if a workspace
// already exists for the registration it just navigates; otherwise it creates the
// single populated workspace, persists workspaceId, and reports to organizers.
// Returns the workspace id (existing or newly created).
export function useGenerateTeamWorkspace() {
  const { addTeamWorkspace, updateHackathonRegistration } = useFounderProfile();
  const navigate = useNavigate();

  return function generate(reg: HackathonRegistration, opts: { navigateAfter?: boolean } = {}): string {
    let workspaceId = reg.workspaceId;
    if (!workspaceId) {
      const ws = buildTeamWorkspace(reg, Date.now());
      addTeamWorkspace(ws);
      updateHackathonRegistration(reg.teamId, { workspaceId: ws.id });
      void provisionTeamWorkspace(reg.hackathonId, reg.teamId, ws.id);
      void reportTeamToOrganizers(reg.hackathonId, reg.teamId, {
        workspaceId: ws.id, idea: ws.idea, team: ws.team, artifacts: ws.artifacts, stage: reg.stage,
      });
      toast.success("Team workspace generated — organizers notified");
      workspaceId = ws.id;
    }
    if (opts.navigateAfter !== false) navigate(`/team-workspace/${reg.teamId}`);
    return workspaceId;
  };
}
