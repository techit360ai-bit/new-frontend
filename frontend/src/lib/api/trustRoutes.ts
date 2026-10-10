// Typed Trust route registry (WS10).
//
// Every trust/investor-trust frontend call resolves its path through this
// registry instead of hand-writing a string. That gives us one place to audit
// the client surface and lets `trustRoutes.parity.test.ts` fail the build when a
// registered route no longer exists on the authority that serves it
// (`backend` = Node, `ai-router` = Python read models).
//
// Path params use `:name` (backend style). `trustPath` encodes replacements and
// throws on a missing param so a mistyped call fails loudly instead of hitting a
// 404 in production.

export type TrustRouteAuthority = "backend" | "ai-router" | "both";
export type TrustRouteMethod = "GET" | "POST" | "DELETE" | "PUT";

export interface TrustRoute {
  authority: TrustRouteAuthority;
  method: TrustRouteMethod;
  path: string;
}

export const TRUST_ROUTES = {
  // --- core profile / badge / history surface ---
  profile: { authority: "both", method: "GET", path: "/trust/profile" },
  badges: { authority: "both", method: "GET", path: "/trust/badges" },
  history: { authority: "both", method: "GET", path: "/trust/history" },
  integrations: { authority: "both", method: "GET", path: "/trust/integrations" },
  refreshSource: { authority: "both", method: "POST", path: "/trust/refresh/:source" },
  verifySource: { authority: "both", method: "POST", path: "/trust/verify/:source" },
  disconnectSource: { authority: "both", method: "POST", path: "/trust/disconnect/:source" },
  notificationsPreview: { authority: "ai-router", method: "POST", path: "/trust/notifications/preview" },
  domainChallenge: { authority: "backend", method: "POST", path: "/trust/domain/challenge" },
  domainChallengeVerify: { authority: "backend", method: "POST", path: "/trust/domain/challenge/:challengeId/verify" },
  proofSubmit: { authority: "backend", method: "POST", path: "/trust/proofs" },
  adapterVerify: { authority: "ai-router", method: "POST", path: "/trust/adapters/:provider/verify" },
  refreshPlan: { authority: "ai-router", method: "POST", path: "/trust/refresh-plan" },
  continuousVerification: { authority: "ai-router", method: "POST", path: "/trust/continuous-verification/run" },

  // --- founder Trust access requests ---
  founderAccessRequests: { authority: "backend", method: "GET", path: "/authorization/founder/trust/access-requests" },
  founderAccessDecision: { authority: "backend", method: "POST", path: "/authorization/founder/trust/access-requests/:requestId/decision" },

  // --- WS3 revenue ---
  revenueCredentials: { authority: "backend", method: "GET", path: "/trust/revenue/credentials" },
  revenueConnect: { authority: "backend", method: "POST", path: "/trust/revenue/connect" },
  revenueVerify: { authority: "backend", method: "POST", path: "/trust/revenue/verify" },
  revenueDisconnect: { authority: "backend", method: "DELETE", path: "/trust/revenue/:provider" },

  // --- WS4 product analytics ---
  analyticsCredentials: { authority: "backend", method: "GET", path: "/trust/analytics/credentials" },
  analyticsConnect: { authority: "backend", method: "POST", path: "/trust/analytics/connect" },
  analyticsVerify: { authority: "backend", method: "POST", path: "/trust/analytics/verify" },
  analyticsDisconnect: { authority: "backend", method: "DELETE", path: "/trust/analytics/:provider" },

  // --- WS5 shipping / deployment cadence ---
  shippingCredentials: { authority: "backend", method: "GET", path: "/trust/shipping/credentials" },
  shippingConnect: { authority: "backend", method: "POST", path: "/trust/shipping/connect" },
  shippingVerify: { authority: "backend", method: "POST", path: "/trust/shipping/verify" },
  shippingDisconnect: { authority: "backend", method: "DELETE", path: "/trust/shipping/:provider" },

  // --- WS6 team / work email / registry / HRIS ---
  teamInvite: { authority: "ai-router", method: "POST", path: "/trust/team/invite" },
  teamVerify: { authority: "ai-router", method: "POST", path: "/trust/team/verify" },
  teamCredentials: { authority: "backend", method: "GET", path: "/trust/team/credentials" },
  teamConnect: { authority: "backend", method: "POST", path: "/trust/team/connect" },
  teamWorkEmailChallenge: { authority: "backend", method: "POST", path: "/trust/team/work-email/challenge" },
  teamWorkEmailVerify: { authority: "backend", method: "POST", path: "/trust/team/work-email/verify" },
  teamRegistryVerify: { authority: "backend", method: "POST", path: "/trust/team/registry/verify" },
  teamHrisVerify: { authority: "backend", method: "POST", path: "/trust/team/hris/verify" },
  teamDisconnect: { authority: "backend", method: "DELETE", path: "/trust/team/credential/:provider" },

  // --- WS7 outcomes / milestone attestation ---
  milestoneList: { authority: "backend", method: "GET", path: "/trust/milestone" },
  milestoneSubmit: { authority: "backend", method: "POST", path: "/trust/milestone" },
  milestoneEvidenceUpload: { authority: "backend", method: "POST", path: "/trust/milestone/evidence" },
  milestoneEvidenceFinalize: { authority: "backend", method: "POST", path: "/trust/milestone/evidence/:evidenceId/finalize" },
  milestoneReview: { authority: "backend", method: "POST", path: "/trust/milestone/review" },

  // --- WS8 founder identity / KYC + screening ---
  identityList: { authority: "backend", method: "GET", path: "/trust/identity" },
  identityConnect: { authority: "backend", method: "POST", path: "/trust/identity/connect" },
  identityCredentials: { authority: "backend", method: "GET", path: "/trust/identity/credentials" },
  identityVerify: { authority: "backend", method: "POST", path: "/trust/identity/verify" },
  identityRegistryVerify: { authority: "backend", method: "POST", path: "/trust/identity/registry/verify" },
  identityScreeningRun: { authority: "backend", method: "POST", path: "/trust/identity/screening" },
  identityScreeningList: { authority: "backend", method: "GET", path: "/trust/identity/screening" },
  identityDisconnect: { authority: "backend", method: "DELETE", path: "/trust/identity/:provider" },

  // --- share preview ---
  shareProfilePreview: { authority: "ai-router", method: "POST", path: "/trust/share-profile/preview" },

  // --- WS9 re-verification + manual overrides ---
  reverificationDue: { authority: "backend", method: "GET", path: "/trust/reverification/due" },
  adminMetrics: { authority: "backend", method: "GET", path: "/trust/admin/metrics" },
  overrideApply: { authority: "backend", method: "POST", path: "/trust/admin/overrides" },
  overrideList: { authority: "backend", method: "GET", path: "/trust/admin/users/:userId/overrides" },
  overrideRevoke: { authority: "backend", method: "DELETE", path: "/trust/admin/users/:userId/overrides/:overrideId" },

  // --- investor trust read model (AI-router) ---
  investorStartups: { authority: "ai-router", method: "GET", path: "/investor/trust/startups" },
  investorDashboard: { authority: "ai-router", method: "GET", path: "/investor/trust/:startupId" },
  investorNotes: { authority: "ai-router", method: "POST", path: "/investor/trust/:startupId/notes" },
  investorAccessRequest: { authority: "backend", method: "GET", path: "/authorization/investor/trust/:startupId/access-request" },
  investorAccessRequestCreate: { authority: "backend", method: "POST", path: "/authorization/investor/trust/:startupId/access-request" },
} as const satisfies Record<string, TrustRoute>;

export type TrustRouteName = keyof typeof TRUST_ROUTES;

const PARAM = /:([A-Za-z0-9_]+)/g;

/** Build a concrete path from a registry entry, encoding all `:params`. */
export function trustPath(name: TrustRouteName, params: Record<string, string | number> = {}): string {
  const route = TRUST_ROUTES[name];
  return route.path.replace(PARAM, (_match, key: string) => {
    const value = params[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`trust route ${name} requires param "${key}"`);
    }
    return encodeURIComponent(String(value));
  });
}

/** Extract the ordered param names declared by a route (used by the parity test). */
export function trustRouteParamNames(name: TrustRouteName): string[] {
  return Array.from(TRUST_ROUTES[name].path.matchAll(PARAM)).map((match) => match[1]);
}

/** List all registered routes for a given authority. */
export function trustRoutesFor(authority: TrustRouteAuthority): Array<{ name: TrustRouteName } & TrustRoute> {
  return (Object.entries(TRUST_ROUTES) as Array<[TrustRouteName, TrustRoute]>)
    .filter(([, route]) => route.authority === authority)
    .map(([name, route]) => ({ name, ...route }));
}
