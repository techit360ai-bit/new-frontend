// Prefill the promotion form from persisted hackathon and founder records.

import type { HackathonRegistration, FounderProfile } from "@/contexts/UserContext";

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
