// derivePassport — pure, deterministic aggregation of a founder's hackathon
// history into a Passport view. Reads only real signals already pinned on the
// registrations (placement, briefScore, momentum, check-ins, demo). No new
// state, no persistence, no randomness. now is passed in (caller owns Date.now()).

import type { HackathonRegistration } from "@/contexts/UserContext";
import { computeMomentum } from "../hackathon/momentum";
import { deriveBadges, type PassportBadge } from "./passportBadges";

export interface PassportTeammate {
  collaboratorId: string;
  name: string;
  role: string;
}

export interface PassportRecord {
  hackathonId: string;
  teamName: string;
  role: "leader" | "member";
  stage: HackathonRegistration["stage"];
  completed: boolean;
  placement?: number;
  cohortSize?: number;
  briefOverall?: number;
  topJudgeComment?: string;
  momentum: number;
  demoShipped: boolean;
  checkInCount: number;
  submittedAt?: string;
  teammates: PassportTeammate[];
}

export interface Passport {
  hackathonsEntered: number;
  hackathonsCompleted: number;
  bestPlacement?: { placement: number; cohortSize: number };
  avgBriefScore?: number;
  demosShipped: number;
  totalCheckIns: number;
  badges: PassportBadge[];
  records: PassportRecord[];
  hasActivity: boolean;
}

function toRecord(reg: HackathonRegistration, now: number): PassportRecord {
  const completed = reg.stage === "submitted-final";
  return {
    hackathonId: reg.hackathonId,
    teamName: reg.teamName,
    role: reg.role,
    stage: reg.stage,
    completed,
    placement: reg.judgeFeedback?.placement,
    cohortSize: reg.judgeFeedback?.cohortSize,
    briefOverall: reg.briefScore?.overall,
    topJudgeComment: reg.judgeFeedback?.comments?.[0],
    momentum: computeMomentum(reg, now).score,
    demoShipped: !!reg.finalSubmission?.demoUrl,
    checkInCount: (reg.checkIns ?? []).length,
    submittedAt: reg.finalSubmission?.submittedAt,
    teammates: (reg.members ?? []).map((m) => ({
      collaboratorId: m.collaboratorId,
      name: m.name,
      role: m.role,
    })),
  };
}

export function derivePassport(regs: HackathonRegistration[], now: number): Passport {
  const records = [...regs]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .map((r) => toRecord(r, now));

  const completedWithPlacement = records.filter((r) => r.completed && r.placement != null);
  let bestPlacement: Passport["bestPlacement"];
  for (const r of completedWithPlacement) {
    if (
      !bestPlacement ||
      r.placement! < bestPlacement.placement ||
      (r.placement! === bestPlacement.placement && (r.cohortSize ?? 0) < bestPlacement.cohortSize)
    ) {
      bestPlacement = { placement: r.placement!, cohortSize: r.cohortSize ?? 0 };
    }
  }

  const briefScores = records.map((r) => r.briefOverall).filter((s): s is number => s != null);
  const avgBriefScore = briefScores.length
    ? Math.round(briefScores.reduce((a, b) => a + b, 0) / briefScores.length)
    : undefined;

  const demosShipped = records.filter((r) => r.demoShipped).length;

  const badges = deriveBadges({
    records: records.map((r) => ({
      placement: r.placement,
      completed: r.completed,
      briefOverall: r.briefOverall,
      demoShipped: r.demoShipped,
      checkInCount: r.checkInCount,
    })),
    hackathonsEntered: records.length,
    demosShipped,
  });

  return {
    hackathonsEntered: records.length,
    hackathonsCompleted: records.filter((r) => r.completed).length,
    bestPlacement,
    avgBriefScore,
    demosShipped,
    totalCheckIns: records.reduce((sum, r) => sum + r.checkInCount, 0),
    badges,
    records,
    hasActivity: records.length > 0,
  };
}
