// Data model for Havi — the AI tour guide for founders & collaborators.
// Adapted from the "AI Tour Guide Setup" design. Where the source tracked a
// fixed 12-week tour, Havi tracks each user's personal "time to MVP".

export type HaviRole = "founder" | "collaborator" | "explorer";

export type PersonalityMode = "supportive" | "coach" | "strict" | "founder";

export interface HaviTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedMinutes: number;
}

export const personalityModes: Record<
  PersonalityMode,
  { name: string; description: string; colorClass: string }
> = {
  supportive: { name: "Supportive", description: "Gentle nudges and encouragement", colorClass: "bg-emerald-500" },
  coach: { name: "Coach", description: "Balanced accountability", colorClass: "bg-blue-500" },
  strict: { name: "Strict", description: "Deadlines enforced", colorClass: "bg-rose-500" },
  founder: { name: "Founder Mode", description: "Blunt, execution-focused", colorClass: "bg-violet-500" },
};

// ─── Default day plans per role ──────────────────────────────────────────────

export function getDefaultTasks(_role: HaviRole): HaviTask[] {
  return [];
}

// ─── Greeting / nudge copy (Havi voice) ──────────────────────────────────────

export const haviMessages = {
  welcomeFounder:
    "Hi, I'm Havi — your build companion. I'll track your time to MVP, keep your momentum honest, and point you to the right next move. Let's set your MVP target and get going.",
  welcomeCollaborator:
    "Hi, I'm Havi — your build companion. I'll keep your sprints on track, watch your momentum, and surface the next best action. Let's lock your MVP target for this build.",
  momentumCheck: "You're building momentum. Keep the streak alive.",
  celebration: "Milestone hit. Momentum is compounding.",
  idle: "You've been quiet for a bit. Want to resume, reschedule, or take a break?",
  riskRevising:
    "You've been revising instead of shipping. That's a classic stall point — want to lock scope and move forward?",
};
