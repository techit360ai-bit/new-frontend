// frontend/src/dashboard/_shared/cards/cardGenerator.ts
//
// Dynamically generates shareable moment cards and smart notification cards
// based on user state, milestones, startup progress, and platform activity.

import type { ShareableCardData } from "./ShareableCard";

export interface UserStateForCards {
  userId: string;
  name: string;
  role: string;
  startupName?: string;
  stage?: string;
  milestoneCompleted?: boolean;
  kycVerified?: boolean;
  hasActiveSubscription?: boolean;
  pendingOpportunitiesCount?: number;
}

export function generateDynamicCardsForUser(state: UserStateForCards): ShareableCardData[] {
  const cards: ShareableCardData[] = [];

  // 1. Founder Milestone / Startup Progress Card
  if (state.startupName && state.milestoneCompleted) {
    cards.push({
      id: `milestone-${state.userId}-${Date.now()}`,
      type: "founder-milestone",
      mode: "celebration",
      title: `${state.startupName} Achieved Verification Milestone!`,
      startupName: state.startupName,
      badgeText: "Milestone Celebration",
      description: `Founder ${state.name} successfully validated startup execution stage (${state.stage || "MVP"}) on TechIT Network.`,
      actionLabel: "View Startup Passport",
      actionPath: "/startup-passport",
    });
  }

  // 2. KYC / Action Required Smart Notification Card
  if (!state.kycVerified) {
    cards.push({
      id: `action-kyc-${state.userId}`,
      type: "action-required",
      mode: "action",
      title: "Complete Identity Verification (KYC)",
      badgeText: "Action Required",
      description: "Unlock paid gigs, enterprise funding opportunities, and trust badges by completing your quick KYC verification.",
      actionLabel: "Verify Now",
      actionPath: "/settings?tab=verification",
    });
  }

  // 3. Subscription Smart Notification Card
  if (state.kycVerified && !state.hasActiveSubscription) {
    cards.push({
      id: `action-sub-${state.userId}`,
      type: "action-required",
      mode: "action",
      title: "Activate Qualifying Subscription",
      badgeText: "Membership Status",
      description: "Activate your professional subscription to participate in high-value paid gigs and verified organization programmes.",
      actionLabel: "Explore Plans",
      actionPath: "/wallet?tab=plans",
    });
  }

  // 4. Founder Identity / Collaborator Recognition Card
  cards.push({
    id: `identity-${state.userId}`,
    type: "founder-identity",
    mode: "intelligence",
    title: `${state.name} — Verified ${state.role.toUpperCase()} on TechIT Network`,
    badgeText: "Verified Identity",
    description: `Active contributor specializing in venture execution, technical collaboration, and verified milestone tracking.`,
    actionLabel: "Connect & Collaborate",
    actionPath: "/profile",
  });

  return cards;
}
