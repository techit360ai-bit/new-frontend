// frontend/src/lib/dashboard/founderIntelligence.ts
//
// Pure derivations for the founder dashboard. Kept out of the component so the
// "real data → card" mapping is unit-testable without a DOM.

import type { CollaboratorTask } from "@/lib/api/collaboratorTasks";
import type { CustomerValidationSession } from "@/lib/api/incubation";
import type { RiskFlag } from "@/lib/api/alerts";

export interface FounderSignal {
  id: string;
  message: string;
  href: string;
}

export interface FounderTask {
  id: string;
  title: string;
  detail: string;
  priority: "overdue" | "due-soon" | "this-week";
  href: string;
  done: boolean;
  workspaceId: string;
  projectId: string;
  projectName: string;
}

export interface JourneyStage {
  id: string;
  label: string;
  status: "complete" | "active" | "upcoming";
  progress: number;
  detail: string;
}

export interface FounderActivity {
  id: string;
  message: string;
  href: string;
}

const JOURNEY_STAGES: Array<{ id: string; label: string; detail: string }> = [
  { id: "idea", label: "Idea", detail: "Problem, customer and solution evidence captured." },
  { id: "mvp", label: "MVP", detail: "A first usable build exists and is being tested." },
  { id: "beta", label: "Beta", detail: "Real users are using the product and feeding back." },
  { id: "launch", label: "Launch", detail: "The product is live and acquiring repeatable users." },
  { id: "growth", label: "Growth", detail: "Retention, revenue and acquisition compound." },
];
const JOURNEY_INDEX: Record<string, number> = { idea: 0, mvp: 1, beta: 2, launch: 3, growth: 4 };

export function toFounderTask(task: CollaboratorTask, nowMs: number = Date.now()): FounderTask {
  const due = new Date(task.deadline).getTime();
  const priority: FounderTask["priority"] = !Number.isNaN(due) && due < nowMs ? "overdue"
    : !Number.isNaN(due) && due - nowMs <= 3 * 86_400_000 ? "due-soon"
      : task.priority === "critical" || task.priority === "high" ? "due-soon"
        : "this-week";
  return {
    id: task.id,
    title: task.title,
    detail: task.aiReason || task.projectName,
    priority,
    href: `/workspaces/build?startup=${task.projectId}`,
    done: task.status === "completed",
    workspaceId: task.workspaceId,
    projectId: task.projectId,
    projectName: task.projectName,
  };
}

export function deriveJourney(stage: string | undefined, progress: number | undefined): JourneyStage[] {
  const current = JOURNEY_INDEX[String(stage ?? "idea").toLowerCase()] ?? 0;
  const bounded = Math.max(0, Math.min(100, Math.round(progress ?? 0)));
  return JOURNEY_STAGES.map((entry, index) => ({
    id: entry.id,
    label: entry.label,
    status: index < current ? "complete" : index === current ? "active" : "upcoming",
    progress: index < current ? 100 : index === current ? (bounded || 40) : 0,
    detail: entry.detail,
  }));
}

export function validationTotals(sessions: CustomerValidationSession[]): { responses: number; qualified: number } {
  return sessions.reduce(
    (acc, session) => ({
      responses: acc.responses + Number(session.totalResponseCount || 0),
      qualified: acc.qualified + Number(session.qualifiedResponseCount || 0),
    }),
    { responses: 0, qualified: 0 },
  );
}

export function deriveFounderSignals(input: {
  riskFlags: RiskFlag[];
  validationSessions: CustomerValidationSession[];
  tasks: FounderTask[];
}): FounderSignal[] {
  const items: FounderSignal[] = [];
  for (const [index, flag] of input.riskFlags.slice(0, 3).entries()) {
    items.push({ id: `risk-${flag.type ?? index}`, message: flag.message ?? flag.type ?? "Risk signal", href: "/founder/dashboard" });
  }
  const totals = validationTotals(input.validationSessions);
  if (totals.responses > 0) {
    const sessions = input.validationSessions.length;
    items.push({ id: "validation", message: `${totals.responses} validation response${totals.responses === 1 ? "" : "s"} (${totals.qualified} qualified) across ${sessions} session${sessions === 1 ? "" : "s"}`, href: "/incubation-hub" });
  }
  const overdue = input.tasks.filter((task) => !task.done && task.priority === "overdue").length;
  if (overdue > 0) items.push({ id: "overdue-tasks", message: `${overdue} workspace task${overdue === 1 ? "" : "s"} past deadline`, href: "/workspaces/build" });
  return items;
}

export function deriveRecentActivity(input: {
  workspaceTasks: CollaboratorTask[];
  validationSessions: CustomerValidationSession[];
}): FounderActivity[] {
  const completedTasks = input.workspaceTasks
    .filter((task) => task.status === "completed")
    .map((task) => ({ id: `task-${task.id}`, message: `Completed “${task.title}” in ${task.projectName}`, href: `/workspaces/build?startup=${task.projectId}` }));
  const sessions = input.validationSessions.map((session) => ({ id: `validation-${session.id}`, message: `Validation “${session.title}” collected ${session.totalResponseCount} responses`, href: "/incubation-hub" }));
  return [...completedTasks, ...sessions].slice(0, 5);
}
