import { normalizeRole } from "./roles";
import {
  Award,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CircleHelp,
  Compass,
  FolderKanban,
  Globe2,
  Handshake,
  Lightbulb,
  Megaphone,
  Puzzle,
  Sparkles,
  Target,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

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

/** Display label + professional icon for every kind, for composer chips. */
export const KIND_META: Record<string, { label: string; icon: LucideIcon }> = {
  milestone: { label: "Milestone Hit", icon: Award },
  insight: { label: "Insight", icon: Lightbulb },
  "build-update": { label: "Build Update", icon: BarChart3 },
  "collab-call": { label: "Collab Call", icon: Handshake },
  question: { label: "Question", icon: CircleHelp },
  problem: { label: "Problem Signal", icon: Globe2 },
  "contribution-update": { label: "Contribution Update", icon: BriefcaseBusiness },
  "skill-showcase": { label: "Skill Showcase", icon: Target },
  "role-available": { label: "Role Available", icon: Puzzle },
  "investment-signal": { label: "Investment Signal", icon: TrendingUp },
  "portfolio-update": { label: "Portfolio Update", icon: FolderKanban },
  "thesis-post": { label: "Thesis", icon: Compass },
  "opportunity-post": { label: "Opportunity", icon: Megaphone },
  "programme-announcement": { label: "Programme", icon: CalendarDays },
  "community-spotlight": { label: "Community Spotlight", icon: Sparkles },
};

/** Semantic styling shared by composer, cards, and post detail. */
export const KIND_COLOR_CLASS: Record<string, string> = {
  milestone: 'border-status-warning text-status-warning', insight: 'border-status-info text-status-info',
  'build-update': 'border-violet-400 text-violet-400', 'collab-call': 'border-status-success text-status-success',
  question: 'border-cyan-400 text-cyan-400', problem: 'border-rose-400 text-rose-400',
  'contribution-update': 'border-status-warning text-status-warning', 'skill-showcase': 'border-fuchsia-400 text-fuchsia-400',
  'role-available': 'border-lime-400 text-lime-400', 'investment-signal': 'border-status-success text-status-success',
  'portfolio-update': 'border-brand-accent text-brand-accent', 'thesis-post': 'border-teal-400 text-teal-400',
  'opportunity-post': 'border-status-info text-status-info', 'programme-announcement': 'border-status-pending text-status-pending',
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
