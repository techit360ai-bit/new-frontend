# TechIT Network Full Product PRD

**Status:** Updated cross-platform product baseline  
**Date:** 2026-09-15  
**Scope:** Frontend, backend, intelligence, Trust, matching, Moments, commercial access, privacy, and operations

## 1. Product Definition

TechIT Network is a role-aware operating network for founders, collaborators, investors, and organizations. It combines execution workflows, evidence-backed intelligence, trusted identity, matching, communication, workspaces, and commercial access into one product.

The product must make useful intelligence visible in context while preserving a strict boundary between deterministic platform truth, private evidence, and AI-generated advisory language.

## 2. Product Outcomes

1. Help founders move from idea to validated execution, team formation, investor visibility, and fundraising readiness.
2. Help collaborators find credible opportunities, execute work, build reputation, and receive fair commercial outcomes.
3. Help investors discover, compare, monitor, and diligence startups using authorized evidence.
4. Help organizations operate programs, cohorts, talent, and portfolio interventions.
5. Turn verified progress into useful, shareable Moments without exposing private evidence.
6. Make access, metering, subscriptions, and credits understandable before a user encounters a hard stop.

## 3. Product Truth Model

### Deterministic platform truth

Owned by backend services and persisted authority:

- Identity and role.
- Permissions and capability gates.
- Trust score, tier, verification status, badges, and expiry.
- Matching eligibility and breadth.
- Subscription status and credit balance.
- Portfolio metrics, risk values, task state, milestones, and deal state.
- Audit history and access decisions.

### Advisory intelligence

May be generated or narrated by AI:

- Explanations.
- Summaries.
- Suggested next actions.
- Portfolio change narratives.
- Recommendations derived from deterministic inputs.

AI must not silently mutate canonical state, grant access, assert unverified facts, or replace deterministic calculations.

## 4. Core Domain Modules

### 4.1 Identity, onboarding, and roles

Requirements:

- Authenticate users and preserve session/token state through onboarding.
- Support founder, collaborator, investor, organization, and Explorer entry contexts.
- Persist role-specific onboarding essentials.
- Support role activation and multi-role context without leaking permissions.
- Present profile completion as a dismissible reminder, not a blocker unless the workflow requires it.

### 4.2 Founder execution

Includes:

- Incubation Hub and idea diagnostics.
- Customer validation and evidence.
- Project/workspace creation.
- Opportunity Hub and collaboration calls.
- Team workspace, tasks, contracts, and milestones.
- Wallet, credits, and execution readiness.
- Trust Center and investor access requests.

### 4.3 Collaborator execution and earnings

Includes:

- Opportunity discovery and matching.
- Tasks, performance, reputation, equity, and earnings.
- Workspace participation and messaging.
- Academy and tools.
- Execution signals used for matching and recommendation explanations.

### 4.4 Investor intelligence and diligence

Includes:

- Deal Intelligence and thesis matching.
- GSIS/readiness/execution/risk signals.
- Risk Analysis and Radar.
- Portfolio allocation, watchlist, heatmap, and capital pools.
- Trust Dashboard and investor-safe startup views.
- Data Rooms and Deal Rooms.
- Diligence checklist, Q&A, technical/revenue verification, references, IC decisions, term sheets, closing, and audit integrity.

### 4.5 Organization operations

Includes:

- Teams, projects, programs, incubators, hackathons, and talent pool.
- Organization Intelligence: health, pulse, risks, actions, KPIs, cohort health, impact, Demo Day, allocation, alumni, and benchmarks.
- AI Operations, analytics, marketplace, market readiness, integrations, billing, and settings.

### 4.6 Network and communication

Includes:

- Feed, discovery, posts, questions, problems, build logs, notifications, profiles, messaging, mentions, and support.
- Recommendation cards and feedback loops.
- Return intelligence for users returning after absence.

### 4.7 Workspaces and tools

Includes:

- Build, code, connectors, agents, chat, copilot, files, GitHub, reports, notifications, and workspace settings.
- BYOK/plugin boundaries and capability authorization.

## 5. Intelligence Architecture

### Intelligence layers

1. **Operational signals:** activity, tasks, milestones, progress, and engagement.
2. **Trust signals:** verification sources, proof status, badges, confidence, and expiry.
3. **Execution signals:** delivery reliability, response velocity, completed work, and collaboration outcomes.
4. **Matching intelligence:** deterministic ranking, overlap, fit, thesis alignment, and access breadth.
5. **Portfolio intelligence:** health, risk, changes, readiness, and intervention priorities.
6. **Advisory narrative:** AI explanation over authorized deterministic evidence.

### Intelligence API requirements

Every intelligence response should declare, where applicable:

- Role and scope.
- As-of/generated timestamp.
- Deterministic versus advisory status.
- Evidence or reason references.
- Access/entitlement context.
- Privacy classification.
- Empty and unavailable semantics.

### Visibility requirement

No intelligence endpoint is considered complete until an appropriate frontend surface exists:

- Inline panel for recurring signals.
- Dedicated page for analysis and comparison.
- Card for a recommendation or entity.
- Modal/pop card for a decision or share action.
- Soft note for non-blocking context.
- Notification for urgent or time-sensitive action.

## 6. Surfacing Taxonomy

| Surface | Use | Examples | Dismissible? |
|---|---|---|---|
| Inline panel | Recurring, scannable intelligence | Daily intelligence, organization health | Usually no; content can refresh |
| Dedicated page | Deep analysis and workflows | Deal Intelligence, Trust Center, Risk Radar | No |
| Recommendation card | One ranked entity and action | Startup, talent, collaborator, opportunity | Often yes |
| Soft note | Context, explanation, access guidance | Profile completion, matching access, Trust Center importance | Yes |
| Pop card/modal | Focused decision or share flow | Moment prompt, investor access approval | Yes or explicit decision |
| Toast | Immediate operation result | Source connected, document saved | Auto-dismiss |
| Notification | Time-sensitive follow-up | Trust expiry, risk alert, investor request | User-controlled/read state |
| Public card/page | Approved external sharing | TechIT Moment, public evidence summary | Not applicable |

## 7. Trust and Investor Visibility

### Trust Center contract

Trust is a metadata-first verification system. The platform may store verification metadata, hashes, statuses, timestamps, confidence, and approved references; it must not expose raw secrets or unapproved payloads.

### Trust tier behavior

- Verification tier controls trust visibility and credibility presentation.
- Verification status controls whether a claim can be treated as verified.
- Verified skills can improve matching relevance.
- Expired or disconnected sources reduce current assurance and create action-required states.

### Investor visibility

Investor-facing views must show only:

- Public or explicitly approved metadata.
- Trust summaries and approved badges.
- Authorized metrics and diligence artifacts.
- Founder-approved access scopes.

Founders must be able to review and approve/reject investor access requests.

## 8. Matching, Subscription, and Credits

### Access model

Matching access is the combination of:

1. Identity and role permission.
2. Trust visibility and verification tier.
3. Subscription entitlement.
4. Purchased credits and metered usage.
5. Organization entitlement or capacity where relevant.
6. Evidence scope and relationship authorization.

### Product rule

Verification increases trust and visibility. Subscriptions and higher credit purchases expand matching breadth and metered intelligence access. Payment must not fabricate trust or bypass evidence authorization.

### Required backend behavior

- Return an authoritative access decision.
- Return current plan, credits, funding source, and capability.
- Enforce limits server-side.
- Keep free quota, subscription usage, and PAYG credits distinct.
- Log usage and settlement idempotently.

### Required frontend behavior

- Explain the current state before a blocked action.
- Show the next access option: verify, upgrade, buy credits, request access, or wait for capacity.
- Make the value and estimated usage clear.
- Keep paywall messaging factual and non-coercive.

## 9. Moments and Shareable Progress

### Product purpose

TechIT Moments convert verified progress into a compact, shareable artifact that can attract collaborators, mentors, investors, or new members.

### Generation rules

- Generated from deterministic progress/evidence signals.
- Role-aware title, narrative, and metrics.
- No raw private evidence.
- Explicit status: pending, published, or dismissed.

### Prompt rules

- Prompt only when a meaningful Moment is pending.
- Offer share or dismiss.
- Polling may discover a pending Moment but must not duplicate it.
- Share action must record channel and produce a public URL or copy fallback.

### Public rules

- Public Moment page renders approved content only.
- Public visit records source/referral.
- Referral may be passed into signup.
- Public page must not reveal private account, project, or evidence data.

## 10. Pop Cards, Soft Notes, and Notifications

### Soft note policy

Soft notes are informative and reversible. They must not be used to disguise a paywall, permission denial, or failed operation.

Required fields:

- Reason shown.
- User benefit or consequence.
- Optional next action.
- Dismiss control.
- Persistence scope and expiry.

### Pop card policy

Pop cards are reserved for focused, consequential interactions: share, approve, reject, confirm, or respond. They must support keyboard access, focus management, Escape/close, and mobile layouts.

### Notification policy

Notifications are for items that may require action after navigation: trust expiry, failed verification, investor request, risk escalation, workflow state change. They need read/unread and action state.

## 11. Privacy, Security, and Governance

- Enforce role and capability gates in backend and frontend.
- Treat AI output as advisory and scope it to authorized evidence.
- Never expose raw tokens, credentials, private notes, or raw verification payloads.
- Use metadata hashes and append-only histories for Trust events.
- Use signed or scoped public tokens for public validation/evidence routes.
- Keep investor visibility founder-controlled where access is consent-based.
- Log sensitive state changes with actor, timestamp, scope, and outcome.
- Ensure public cards and referral events are privacy-reviewed.

## 12. Data and API Contracts

Core contracts include:

- Auth/session/profile and role context.
- Daily intelligence and continuous recommendations.
- Recommendation and matching access.
- Organization intelligence.
- Investor intelligence and advisory.
- Trust profile, badges, history, integrations, notifications, and access requests.
- Moments prompt, dismiss, share, public retrieval, and visit attribution.
- TVCE paywall, next-best-action, usage, checkout, wallet, and entitlements.
- Feed/discovery recommendations, exposure, feedback, and return summary.
- Mentorship, workspaces, deal rooms, data rooms, and support.

Each contract must define authorization, privacy classification, deterministic/advisory status, error behavior, and an empty response shape.

## 13. Platform Analytics and Success Metrics

### Activation

- Onboarding completion by role.
- Profile completion rate.
- First meaningful workflow started.

### Intelligence usefulness

- Intelligence panel impressions.
- Recommendation action rate.
- Recommendation dismissal/negative feedback rate.
- Next-action completion rate.
- Return-intelligence catch-up completion.

### Trust and visibility

- Verification source connection rate.
- Verification completion and expiry recovery.
- Approved investor access requests.
- Public profile/Moment views from trust signals.

### Commercial conversion

- Paywall-to-funding CTA rate.
- Subscription conversion.
- Credit purchase conversion.
- Metered workflow completion.
- Cost and margin per intelligence capability.

### Network growth

- Moment shares by channel.
- Public Moment visits.
- Referral-to-signup conversion.
- Collaboration and mentorship applications.

## 14. Operational Requirements

- Frontend build and typecheck must pass before merge.
- Backend unit/integration/security/policy checks must pass before merge.
- Route and API contract tests cover each role and capability gate.
- Deployments must preserve environment contracts and public/private route boundaries.
- Intelligence failures degrade gracefully to empty or rule-based guidance without fabricated claims.
- Polling must be bounded and cleaned up on unmount.
- Usage settlement and payment fulfillment must be idempotent.

## 15. Current Implementation Baseline

The merged baseline already includes:

- Role-specific frontend shells and route guards.
- Continuous intelligence and next-best-action surfaces.
- Investor and organization intelligence panels.
- Trust Center with verification, badges, history, notifications, and access requests.
- Matching recommendations across founder, collaborator, mentor, investor, and organization workflows.
- Matching access metered by verification, subscriptions, and credits.
- Feed/discovery recommendation cards and return intelligence.
- TechIT Moments prompt, card, public page, sharing, and referral visit tracking.
- Workspaces, messaging, mentorship, investor diligence, organization operations, wallet, and compliance surfaces.

## 16. Open Product Decisions

1. Should matching breadth be shown as a precise limit everywhere or only where it affects the current workflow?
2. What is the standard dismissal lifetime for recurring soft notes: session, seven days, or until state changes?
3. Which Moments qualify for automatic generation versus user-triggered generation?
4. Which investor-visible Trust fields are globally public, founder-approved, or relationship-scoped?
5. What are the commercial plan names, credit packages, and role-specific quotas for launch?
6. Which intelligence events should become push/email notifications versus in-product-only notes?
7. What is the target freshness SLA for each intelligence family?

## 17. Acceptance Criteria

The product is considered aligned to this PRD when:

- Every role can access its primary execution workflows without fabricated fallback data.
- Every major backend intelligence capability has a visible frontend surface.
- Trust visibility, matching breadth, and metered access are separately explained and enforced.
- Moments are shareable, attributable, privacy-safe, and dismissible.
- Soft notes and pop cards are accessible, non-blocking unless explicitly transactional, and state-aware.
- Investor and organization intelligence remain authorization-scoped.
- AI advisory content is labeled and cannot alter canonical decisions.
- Public surfaces expose only approved metadata.
- CI, security, audit, and contract gates pass for frontend and backend changes.
