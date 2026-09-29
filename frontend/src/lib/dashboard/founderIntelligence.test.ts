import { describe, expect, test } from "vitest";
import type { CollaboratorTask } from "@/lib/api/collaboratorTasks";
import type { CustomerValidationSession } from "@/lib/api/incubation";
import {
  deriveFounderSignals,
  deriveJourney,
  deriveRecentActivity,
  toFounderTask,
  validationTotals,
} from "./founderIntelligence";

const NOW = Date.parse("2026-09-29T12:00:00.000Z");

function task(overrides: Partial<CollaboratorTask> = {}): CollaboratorTask {
  return {
    id: "task-1",
    workspaceId: "ws-1",
    title: "Ship onboarding",
    projectId: "proj-1",
    projectName: "Northstar",
    priority: "medium",
    deadline: "2026-10-30",
    impactScore: 70,
    dependencies: [],
    aiReason: "Unblocks activation",
    status: "pending",
    aiRank: 1,
    ...overrides,
  };
}

function session(overrides: Partial<CustomerValidationSession> = {}): CustomerValidationSession {
  return {
    id: "val-1",
    projectId: "proj-1",
    title: "Interview round 1",
    objective: "Validate pain",
    mode: "async",
    stage: "active",
    questions: [],
    status: "active",
    configurationLocked: false,
    totalResponseCount: 10,
    qualifiedResponseCount: 6,
    qualityCounts: {},
    confidenceLevel: "medium",
    ...overrides,
  } as CustomerValidationSession;
}

describe("deriveJourney", () => {
  test("marks earlier stages complete, the current stage active, later stages upcoming", () => {
    const stages = deriveJourney("mvp", 62);
    expect(stages.map((stage) => stage.id)).toEqual(["idea", "mvp", "beta", "launch", "growth"]);
    expect(stages.map((stage) => stage.status)).toEqual(["complete", "active", "upcoming", "upcoming", "upcoming"]);
    expect(stages[0].progress).toBe(100);
    expect(stages[1].progress).toBe(62);
    expect(stages[2].progress).toBe(0);
  });

  test("defaults to the idea stage when the stage is unknown", () => {
    const stages = deriveJourney(undefined, undefined);
    expect(stages[0].status).toBe("active");
    expect(stages[0].progress).toBe(40);
  });
});

describe("toFounderTask", () => {
  test("derives priority from the deadline and links to the workspace", () => {
    const overdue = toFounderTask(task({ deadline: "2026-09-01" }), NOW);
    expect(overdue.priority).toBe("overdue");
    expect(overdue.href).toBe("/workspaces/build?startup=proj-1");

    const dueSoon = toFounderTask(task({ deadline: "2026-09-30" }), NOW);
    expect(dueSoon.priority).toBe("due-soon");

    const later = toFounderTask(task({ deadline: "2026-11-30" }), NOW);
    expect(later.priority).toBe("this-week");
  });

  test("escalates critical tasks without a near deadline to due-soon", () => {
    expect(toFounderTask(task({ deadline: "2026-11-30", priority: "critical" }), NOW).priority).toBe("due-soon");
  });

  test("reflects completion status", () => {
    expect(toFounderTask(task({ status: "completed" }), NOW).done).toBe(true);
  });
});

describe("deriveFounderSignals", () => {
  test("composes risk flags, validation evidence and overdue tasks", () => {
    const signals = deriveFounderSignals({
      riskFlags: [{ type: "burn", message: "Runway below 3 months" }],
      validationSessions: [session({ totalResponseCount: 10, qualifiedResponseCount: 6 })],
      tasks: [toFounderTask(task({ deadline: "2026-09-01" }), NOW)],
    });
    expect(signals.map((signal) => signal.id)).toEqual(["risk-burn", "validation", "overdue-tasks"]);
    expect(signals[1].message).toContain("10 validation responses (6 qualified) across 1 session");
    expect(signals[2].message).toContain("1 workspace task past deadline");
  });

  test("returns nothing when there is no real evidence", () => {
    expect(deriveFounderSignals({ riskFlags: [], validationSessions: [], tasks: [] })).toEqual([]);
  });
});

describe("deriveRecentActivity", () => {
  test("shows completed tasks and validation sessions, capped at five", () => {
    const rows = deriveRecentActivity({
      workspaceTasks: [
        task({ id: "a", status: "completed", title: "Alpha" }),
        task({ id: "b", status: "pending", title: "Beta" }),
      ],
      validationSessions: [session({ id: "val-9", title: "Round 2", totalResponseCount: 4 })],
    });
    expect(rows).toEqual([
      { id: "task-a", message: "Completed “Alpha” in Northstar", href: "/workspaces/build?startup=proj-1" },
      { id: "validation-val-9", message: "Validation “Round 2” collected 4 responses", href: "/incubation-hub" },
    ]);
  });
});

test("validationTotals sums responses and qualified responses", () => {
  expect(validationTotals([session(), session({ id: "v2", totalResponseCount: 5, qualifiedResponseCount: 2 })]))
    .toEqual({ responses: 15, qualified: 8 });
});
