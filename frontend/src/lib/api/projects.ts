// frontend/src/lib/api/projects.ts
//
// Founder projects (multi-venture portfolio) — BACKEND /api/domain/founder/projects.

import { domainGet, domainPost } from "@/lib/domainApi";

export interface FounderProject {
  id: string;
  title: string;
  tagline: string;
  industry: string;
  stage: string;
  isPrimary: boolean;
  gsisScore: number;
  hasWorkspace: boolean;
  origin?: ProjectOrigin;
  progress?: number;
  users?: number;
  revenueMonthly?: number;
  updatedAt?: string;
}

export interface ProjectOrigin {
  kind: "hackathon_promote" | "hackathon" | "venture_intake";
  hackathonId?: string;
  teamId?: string;
  intakeId?: string;
}

/** GET /api/domain/founder/projects — the founder's persisted portfolio of ventures. */
export function fetchFounderProjects(): Promise<FounderProject[]> {
  return domainGet<{ projects: FounderProject[] }>("/founder/projects").then((data) => data.projects);
}

/** POST /api/domain/founder/projects — create a new venture.
 *  Pass `hackathonId` + `teamId` when promoting from a hackathon so the venture
 *  carries an `origin` record back to the source team (server-side persistence). */
export function createFounderProject(
  body: {
    title: string;
    tagline?: string;
    industry?: string;
    stage?: string;
    hackathonId?: string;
    teamId?: string;
  },
): Promise<{ ok: boolean; project?: FounderProject; error?: string }> {
  const origin: ProjectOrigin | undefined =
    body.hackathonId && body.teamId
      ? { kind: "hackathon_promote", hackathonId: body.hackathonId, teamId: body.teamId }
      : undefined;
  return domainPost<{ project: FounderProject }>("/founder/projects", { ...body, ...(origin ? { origin } : {}) })
    .then(({ project }) => ({ ok: true, project }));
}
