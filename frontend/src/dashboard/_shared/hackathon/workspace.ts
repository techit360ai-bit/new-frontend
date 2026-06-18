// buildTeamWorkspace — pure, deterministic. Seeds a TeamWorkspace record from a
// registration: idea (the 7 brief fields), team roster, and submission artifacts.
// now is passed in (caller owns Date.now()). No React, no side effects.

import type { HackathonRegistration, TeamWorkspace } from "@/contexts/UserContext";

export function buildTeamWorkspace(reg: HackathonRegistration, now: number): TeamWorkspace {
  return {
    id: `ws_team_${now}`,
    hackathonId: reg.hackathonId,
    teamId: reg.teamId,
    teamName: reg.teamName,
    createdAt: new Date(now).toISOString(),
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
