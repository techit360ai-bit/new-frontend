import { apiGet, apiPost } from "./client";

export interface ScaffoldGenerationInput {
  project_id: string;
  scaffold_type?: string;
  custom_prompt?: string;
}

export interface ScaffoldResponse {
  scaffold_id: string;
  scaffold_type: string;
  pages: Array<Record<string, unknown>>;
  schema_sql: string;
  api_routes: Array<Record<string, unknown>>;
  env_template: string;
  components: Array<Record<string, unknown>>;
  setup_steps: string[];
  estimated_build_hours: number;
}

export const generateScaffold = (input: ScaffoldGenerationInput) =>
  apiPost<ScaffoldResponse>("/scaffold/generate", input);

export const fetchScaffoldByProject = (projectId: string) =>
  apiGet<ScaffoldResponse>(`/scaffold/${encodeURIComponent(projectId)}`);

export const deployScaffold = (scaffoldId: string) =>
  apiPost<{ scaffold_id: string; deploy_status: string; live_url?: string }>(`/scaffold/${encodeURIComponent(scaffoldId)}/deploy`, {});

export const fetchScaffoldStatus = (scaffoldId: string) =>
  apiGet<{ scaffold_id: string; deploy_status: string; live_url?: string; ready: boolean }>(`/scaffold/${encodeURIComponent(scaffoldId)}/status`);

export const fetchScaffoldLiveUrl = (scaffoldId: string) =>
  apiGet<{ scaffold_id: string; live_url: string; deploy_status: string }>(`/scaffold/${encodeURIComponent(scaffoldId)}/live-url`);

export const fetchScaffoldStacks = () =>
  apiGet<{ stacks: Array<{ id: string; name: string; description: string }> }>("/scaffold/stacks");
