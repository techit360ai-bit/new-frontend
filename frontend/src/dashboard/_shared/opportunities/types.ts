export type OpportunityType = "hackathon" | "program" | "funding" | "event" | "collaboration";
export type OpportunityStatus = "open" | "closing-soon" | "closed";

interface OpportunityBase {
  id: string;
  type: OpportunityType;
  title: string;
  organizer: { id: string; name: string; logoEmoji?: string };
  poster: string;
  summary: string;
  status: OpportunityStatus;
  applyDeadline: string;
  publishedAt: string;
  tags: string[];
  featured?: boolean;
}

export interface Hackathon extends OpportunityBase {
  type: "hackathon";
  theme: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  prizePool: string;
  partners: string[];
  registrants: number;
  teamsFormed: number;
  hackathonStatus: "upcoming" | "live" | "judging" | "completed";
}

export interface Program extends OpportunityBase {
  type: "program";
  format: "incubator" | "accelerator" | "mentorship";
  durationWeeks: number;
  cohortSize: number;
  perks: string[];
  startDate: string;
}

export interface Funding extends OpportunityBase {
  type: "funding";
  format: "grant" | "rfp" | "pilot";
  amountRange: string;
  equityRequired: boolean;
  audienceStage: ("Idea" | "MVP" | "Beta" | "Launch" | "Growth")[];
}

export interface Event extends OpportunityBase {
  type: "event";
  format: "demo-day" | "masterclass" | "ama" | "panel" | "workshop";
  startDate: string;
  durationMinutes: number;
  hostedBy: string;
  isVirtual: boolean;
}

export interface CollaborationCall extends OpportunityBase {
  type: "collaboration";
  role: string;
  skills: string[];
  scope: string;
  timeCommitment: string;
  cashCompMonthly: number;
  equityPercent: number;
  audienceRoles: ("collaborator" | "founder" | "explorer")[];
}

export type Opportunity = Hackathon | Program | Funding | Event | CollaborationCall;
