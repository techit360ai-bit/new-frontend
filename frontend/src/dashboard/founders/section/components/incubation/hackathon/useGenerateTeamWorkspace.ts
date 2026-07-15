import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { HackathonRegistration } from "@/contexts/UserContext";
import { useFounderProfile } from "@/contexts/UserContext";
import { buildTeamWorkspace } from "@/dashboard/_shared/hackathon/workspace";
import { provisionTeamWorkspace, reportTeamToOrganizers } from "@/lib/api/hackathon";

export function useGenerateTeamWorkspace() {
  const { addTeamWorkspace, registerForHackathon } = useFounderProfile();
  const navigate = useNavigate();

  return async function generate(
    registration: HackathonRegistration,
    options: { navigateAfter?: boolean } = {},
  ): Promise<string | null> {
    if (registration.workspaceId) {
      if (options.navigateAfter !== false) navigate(`/team-workspace/${registration.teamId}`);
      return registration.workspaceId;
    }

    try {
      const result = await provisionTeamWorkspace(registration.hackathonId, registration.teamId);
      if (!result.ok || !result.workspace?.id) {
        toast.error("The team workspace was not persisted.");
        return null;
      }

      const workspaceId = result.workspace.id;
      const workspace = {
        ...buildTeamWorkspace(registration, Date.now()),
        id: workspaceId,
        projectId: result.workspace.projectId,
      };
      addTeamWorkspace(workspace);
      if (result.registration) registerForHackathon(result.registration);
      await reportTeamToOrganizers(registration.hackathonId, registration.teamId, {
        workspaceId,
        idea: workspace.idea,
        team: workspace.team,
        artifacts: workspace.artifacts,
        stage: registration.stage,
      });
      toast.success("Team workspace generated — organizers notified");
      if (options.navigateAfter !== false) navigate(`/team-workspace/${registration.teamId}`);
      return workspaceId;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The team workspace could not be created.");
      return null;
    }
  };
}
