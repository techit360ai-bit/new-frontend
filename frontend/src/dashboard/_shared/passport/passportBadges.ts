// Canned passport badge catalog + pure, deterministic rule evaluator.
// Mirrors judgeComments.ts / critiques.ts — the deriver carries no copy of
// the badge copy. No randomness. A badge appears at most once, in catalog order.

export interface PassportBadge {
  id: string;
  label: string;
  description: string;
}

interface BadgeRecordInput {
  placement?: number;
  completed: boolean;
  briefOverall?: number;
  demoShipped: boolean;
  checkInCount: number;
}

export interface BadgeInput {
  records: BadgeRecordInput[];
  hackathonsEntered: number;
  demosShipped: number;
}

// Catalog order IS display order. Each entry: badge + predicate over the input.
const CATALOG: { badge: PassportBadge; earned: (i: BadgeInput) => boolean }[] = [
  {
    badge: { id: "champion", label: "Champion", description: "Placed 1st in a hackathon." },
    earned: (i) => i.records.some((r) => r.completed && r.placement === 1),
  },
  {
    badge: { id: "podium", label: "Top-3 Finish", description: "Placed in the top 3 of a hackathon." },
    earned: (i) => i.records.some((r) => r.completed && r.placement != null && r.placement <= 3),
  },
  {
    badge: { id: "demo-shipper", label: "Demo Shipper", description: "Shipped a working demo at submission." },
    earned: (i) => i.demosShipped >= 1,
  },
  {
    badge: { id: "serial-builder", label: "Serial Builder", description: "Entered 3 or more hackathons." },
    earned: (i) => i.hackathonsEntered >= 3,
  },
  {
    badge: { id: "strong-brief", label: "Strong Brief", description: "Scored 80+ on an idea brief." },
    earned: (i) => i.records.some((r) => r.briefOverall != null && r.briefOverall >= 80),
  },
  {
    badge: { id: "consistent", label: "Consistent Builder", description: "Logged 5+ check-ins in a single build." },
    earned: (i) => i.records.some((r) => r.checkInCount >= 5),
  },
];

export function deriveBadges(input: BadgeInput): PassportBadge[] {
  return CATALOG.filter((c) => c.earned(input)).map((c) => c.badge);
}
