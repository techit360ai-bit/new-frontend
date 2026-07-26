import { domainGet } from "@/lib/domainApi";

export interface CollaboratorScores {
  cbs: number;
  tss: Record<string, number>;
  crs: number;
}

export async function fetchCollaboratorScores(): Promise<CollaboratorScores> {
  const data = await domainGet<{ scores: CollaboratorScores }>("/collaborator/scores");
  return data.scores ?? { cbs: 0, tss: {}, crs: 0 };
}
