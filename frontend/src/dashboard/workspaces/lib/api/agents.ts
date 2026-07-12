import type { AIAgent } from '../../components/ai/AIAgentCard';
import { workspaceGet, workspacePost } from './client';

function normalizeAgent(row: Partial<AIAgent> & Record<string, unknown>): AIAgent {
  return {
    id: String(row.id),
    name: String(row.name ?? 'Agent'),
    description: String(row.description ?? ''),
    fullDescription: String(row.fullDescription ?? row.full_description ?? row.description ?? ''),
    category: String(row.category ?? 'Workspace'),
    isPremium: Boolean(row.isPremium ?? row.is_premium),
    icon: String(row.icon ?? 'bot'),
    enabled: Boolean(row.enabled),
  };
}

export async function listAgents(): Promise<AIAgent[]> {
  const data = await workspaceGet<{ agents: Array<Partial<AIAgent> & Record<string, unknown>> }>('/agents');
  const byId = new Map<string, AIAgent>();
  for (const agent of data?.agents.map(normalizeAgent) ?? []) {
    if (!byId.has(agent.id)) byId.set(agent.id, agent);
  }
  return [...byId.values()];
}

export async function toggleAgent(id: string): Promise<AIAgent[]> {
  const current = await listAgents();
  const agent = current.find((item) => item.id === id);
  if (!agent) return current;
  await workspacePost('/agents', { ...agent, enabled: !agent.enabled, sourceAgentId: id });
  return listAgents();
}

export async function addCustomAgent(input: { name: string; endpoint: string }): Promise<AIAgent[]> {
  await workspacePost('/agents', {
    name: input.name,
    description: 'Custom API-integrated agent',
    fullDescription: `Custom agent via ${input.endpoint}`,
    category: 'Builder',
    isPremium: false,
    icon: 'code',
    enabled: true,
  });
  return listAgents();
}
