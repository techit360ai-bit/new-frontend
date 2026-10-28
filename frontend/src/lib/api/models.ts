import { apiGet } from "./client";

export interface SelectableModel {
  id: string;
  provider: string;
  quality_tier: string;
  quality_score: number;
  configured: boolean;
  tags: string[];
}

export function fetchSelectableModels(taskType?: string): Promise<SelectableModel[]> {
  const query = taskType ? `?task_type=${encodeURIComponent(taskType)}` : "";
  return apiGet<{ models: SelectableModel[] }>(`/models${query}`).then((result) => result.models);
}
