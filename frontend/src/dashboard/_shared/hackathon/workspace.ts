// Build the client view from a persisted workspace ID and registration data.

import type { HackathonRegistration, TeamWorkspace } from "@/contexts/UserContext";

export function buildTeamWorkspace(
  reg: HackathonRegistration,
  workspaceId: string,
  createdAt = new Date().toISOString(),
): TeamWorkspace {
  return {
    id: workspaceId,
    hackathonId: reg.hackathonId,
    teamId: reg.teamId,
    teamName: reg.teamName,
    createdAt,
    idea: reg.brief
      ? {
          problem: reg.brief.problem, targetUser: reg.brief.targetUser,
          solutionSketch: reg.brief.solutionSketch, whyNow: reg.brief.whyNow,
          differentiator: reg.brief.differentiator, risk: reg.brief.risk,
          successMetric: reg.brief.successMetric,
        }
      : null,
    team: (reg.members ?? []).map((m) => ({ collaboratorId: m.collaboratorId, name: m.name, role: m.role })),
    artifacts: reg.finalSubmission
      ? { demoUrl: reg.finalSubmission.demoUrl, deckUrl: reg.finalSubmission.deckUrl, videoUrl: reg.finalSubmission.videoUrl }
      : null,
  };
}
