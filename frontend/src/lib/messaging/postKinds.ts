import { normalizeRole } from "./roles";

// Canonical generic kinds (every role). Mirrors store.GenericKinds (Go); the
// backend also accepts legacy aliases build/collab/update, but the composer
// emits these canonical ids going forward.
export const GENERIC_KINDS: string[] = [
  "milestone",
  "insight",
  "build-update",
  "collab-call",
  "question",
  "problem",
];

// Role-specific kinds added on top of generic. Mirrors store.RoleKinds (Go).
export const ROLE_KINDS: Record<string, string[]> = {
  collaborator: ["contribution-update", "skill-showcase", "role-available"],
  investor: ["investment-signal", "portfolio-update", "thesis-post"],
  organisation: ["opportunity-post", "programme-announcement", "community-spotlight"],
};

/** Kinds a viewer of `role` may post: generic ∪ role-specific. Unknown -> generic. */
export function kindsForRole(role: string): string[] {
  return [...GENERIC_KINDS, ...(ROLE_KINDS[normalizeRole(role)] ?? [])];
}

/** Display label + emoji for every kind, for composer chips. */
export const KIND_META: Record<string, { label: string; emoji: string }> = {
  milestone: { label: "Milestone Hit", emoji: "🏆" },
  insight: { label: "Insight", emoji: "💡" },
  "build-update": { label: "Build Update", emoji: "📊" },
  "collab-call": { label: "Collab Call", emoji: "🤝" },
  question: { label: "Question", emoji: "❓" },
  problem: { label: "Problem Signal", emoji: "🌍" },
  "contribution-update": { label: "Contribution Update", emoji: "🧱" },
  "skill-showcase": { label: "Skill Showcase", emoji: "🎯" },
  "role-available": { label: "Role Available", emoji: "🧩" },
  "investment-signal": { label: "Investment Signal", emoji: "📈" },
  "portfolio-update": { label: "Portfolio Update", emoji: "📁" },
  "thesis-post": { label: "Thesis", emoji: "🧭" },
  "opportunity-post": { label: "Opportunity", emoji: "📣" },
  "programme-announcement": { label: "Programme", emoji: "📅" },
  "community-spotlight": { label: "Community Spotlight", emoji: "🌟" },
};
