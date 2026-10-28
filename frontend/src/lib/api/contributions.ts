import { domainGet } from "@/lib/domainApi";

export interface ContributionRecord {
  id: string;
  collaboratorId: string;
  projectId: string;
  projectName: string;
  role: string;
  startDate: string;
  endDate: string | null;
  milestonesShipped: number;
  gsisChange: number;
  technologies: string[];
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchContributions(): Promise<ContributionRecord[]> {
  const data = await domainGet<{ contributions: ContributionRecord[] }>("/collaborator/contributions");
  return data.contributions ?? [];
}
