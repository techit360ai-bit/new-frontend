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

/** Semantic styling shared by composer, cards, and post detail. */
export const KIND_COLOR_CLASS: Record<string, string> = {
  milestone: 'border-amber-400 text-amber-400', insight: 'border-sky-400 text-sky-400',
  'build-update': 'border-violet-400 text-violet-400', 'collab-call': 'border-emerald-400 text-emerald-400',
  question: 'border-cyan-400 text-cyan-400', problem: 'border-rose-400 text-rose-400',
  'contribution-update': 'border-orange-400 text-orange-400', 'skill-showcase': 'border-fuchsia-400 text-fuchsia-400',
  'role-available': 'border-lime-400 text-lime-400', 'investment-signal': 'border-green-400 text-green-400',
  'portfolio-update': 'border-indigo-400 text-indigo-400', 'thesis-post': 'border-teal-400 text-teal-400',
  'opportunity-post': 'border-blue-400 text-blue-400', 'programme-announcement': 'border-purple-400 text-purple-400',
  'community-spotlight': 'border-pink-400 text-pink-400',
};

export function kindColorClass(kind: string): string {
  return KIND_COLOR_CLASS[kind] ?? 'border-accent-primary text-accent-primary';
}

export function gsisColorClass(score: number): string {
  if (score >= 80) return 'text-score-green';
  if (score >= 60) return 'text-score-yellow';
  if (score >= 40) return 'text-score-orange';
  return 'text-score-red';
}
