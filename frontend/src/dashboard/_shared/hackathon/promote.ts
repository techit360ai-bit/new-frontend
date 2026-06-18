// Pure promote derivation. promoteDefaults prefills the confirm modal from the
// hackathon data; buildPromotedProject applies overrides and seeds gsisScore from
// the real pinned briefScore. now passed in (caller owns Date.now()). No randomness.

import type { HackathonRegistration, FounderProfile } from "@/contexts/UserContext";
import type { FounderProject } from "@/lib/api/projects";

export interface PromoteOverrides {
  title?: string;
  tagline?: string;
  industry?: string;
  stage?: string;
}

export function promoteDefaults(reg: HackathonRegistration, fp: FounderProfile): Required<PromoteOverrides> {
  return {
    title: reg.teamName,
    tagline: (reg.brief?.solutionSketch ?? "").trim().slice(0, 120),
    industry: fp.industries[0] ?? "",
    stage: "mvp",
  };
}

export function buildPromotedProject(
  reg: HackathonRegistration,
  fp: FounderProfile,
  overrides: PromoteOverrides,
  now: number,
): FounderProject {
  const d = promoteDefaults(reg, fp);
  return {
    id: `proj_local_${now}`,
    title: (overrides.title ?? d.title).trim(),
    tagline: (overrides.tagline ?? d.tagline).trim(),
    industry: overrides.industry ?? d.industry,
    stage: overrides.stage ?? d.stage,
    isPrimary: false,
    gsisScore: reg.briefScore?.overall ?? 0,
    hasWorkspace: true,
  };
}
