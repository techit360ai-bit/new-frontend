# TechIT Network Frontend Implementation PRD

**Status:** Updated product and implementation baseline  
**Date:** 2026-09-15  
**Owner:** Product + Frontend  
**Source of truth:** `origin/main` of `new-frontend`

## 1. Purpose

This PRD defines the frontend product surface for TechIT Network: role portals, shared intelligence, matching, Trust, Moments, workspaces, feed/discovery, mentorship, investor diligence, organization operations, billing access, and public sharing.

It is intentionally implementation-aware. Requirements marked **Implemented** describe behavior already present in the merged frontend. Requirements marked **Required** are the acceptance standard for future changes or completion work.

## 2. Product Principles

1. **Visible intelligence:** Intelligence must be rendered in the workflow where it is useful. API-only intelligence is incomplete.
2. **Action over explanation:** Every actionable signal should link to the next relevant workflow.
3. **Progressive disclosure:** Keep dashboards scannable; expose detail through dedicated pages, cards, drawers, and routes.
4. **Dismissible assistance:** Soft notes and reminders may be dismissed without deleting the underlying data or capability.
5. **Deterministic truth:** Scores, access, verification, billing, and permissions come from backend contracts. AI language is advisory.
6. **Privacy by default:** Public cards expose approved metadata only. Raw evidence, secrets, and private diligence remain protected.
7. **Role clarity:** Founder, collaborator, investor, and organization experiences share platform primitives but retain role-specific navigation and vocabulary.

## 3. Audience and Roles

| Role | Primary job | Frontend shell |
|---|---|---|
| Founder | Build, validate, publish, recruit, establish trust, and engage investors | Founder Portal |
| Collaborator | Find work, execute tasks, build reputation, and earn | Collaborator Portal |
| Investor | Discover startups, monitor risk, perform diligence, and manage deals | Investor Intelligence |
| Organization | Operate programs, manage talent, monitor portfolio health, and allocate resources | Organization Portal |
| Explorer/authenticated member | Browse network and enter a role workflow | Explore, Feed, onboarding |

## 4. Information Architecture

### Public and entry surfaces

- Landing page, signup, signin, password recovery, compliance, verification, and public Moment routes.
- Public validation and evidence-summary routes for approved share tokens.
- Authenticated Explore and Feed surfaces.

### Founder routes

- Dashboard, onboarding, profile, settings, messages, Trust Center, Incubation Hub, Opportunity Hub, matches, team workspace, wallet, mentorship, and contracts.

### Collaborator routes

- Dashboard, tasks, performance, earnings, equity, opportunities, reputation, messages, academy, tools, profile, and settings.

### Investor routes

- Dashboard, Deal Intelligence, Risk Analysis/Radar, Allocation Engine, Watchlist, Capital Pools, Heatmap, Data Rooms, Deal Rooms, Trust Dashboard, Reputation, Profile, Deal Pipeline, Mentorship Hub, and startup intelligence detail.

### Organization routes

- Dashboard, Intelligence tabs, Teams, Projects, Incubator Programs, Hackathons, Talent Pool, AI Operations, Analytics, Marketplace, Market Ready, Hangout, Integrations, Billing, Settings, and Profile.

### Shared routes

- Feed, discovery, messages, workspaces, support, wallet, privacy/compliance, demos, invitations, mentorship invites, and public Moments.

## 5. Shared Frontend Primitives

### 5.1 Role shell

**Implemented:** Each role shell provides navigation, responsive mobile menu, role branding, profile completion reminder, next-best-action note, and continuous intelligence panel.

**Required:**

- Preserve shell-level loading, error, empty, and unauthorized states.
- Keep shell banners ordered by urgency: blocking authorization, profile completion, funding/access guidance, daily intelligence.
- Do not allow a soft note to cover primary navigation or obscure the first meaningful action.

### 5.2 Loading and failure states

Every data-backed surface must support:

- Loading state with stable layout dimensions.
- Empty state that explains what is absent without fabricating data.
- Recoverable error state with retry.
- Authorization state with the capability and next access option.
- Stale-data indicator where polling or refresh is used.

### 5.3 Buttons, icons, and dismissal

- Use familiar icons for refresh, close, share, link, risk, trust, and navigation.
- Every dismissible note/card requires an accessible close label and keyboard target.
- Dismissal must be local UI state plus persistence where repeat display would be disruptive.
- Dismissal must not mutate the underlying recommendation, score, evidence, or entitlement.

## 6. Intelligence Surfaces

### 6.1 Continuous Intelligence Panel

**Location:** Founder, collaborator, investor, and organization shells.  
**Component:** `ContinuousIntelligencePanel`  
**Refresh:** Initial load plus five-minute polling.

**Implemented content:**

- Daily intelligence date.
- Risk signal count.
- First recommended action.
- Matching-access soft note with visibility, verification tier, subscription state, credits, and matching breadth.
- Per-role session dismissal.

**Required behavior:**

- Render only backend-returned signals.
- If daily intelligence fails but access succeeds, show access guidance without treating it as intelligence.
- If access fails but intelligence succeeds, retain the intelligence panel and omit the entitlement note.
- Link funding guidance to Wallet or Organization Billing when a CTA is added.

### 6.2 Next Best Action Note

**Component:** `NextBestActionNote`  
**Implemented:** Reads TVCE next-action context, explains value, metering, credits, subscription recommendation, and links to funding.

**Required behavior:**

- Show only when access is unavailable, runtime metering applies, or a subscription recommendation is present.
- Use plain-language action, reason, expected value, estimated credits, and available credits.
- Remain dismissible per role/session.

### 6.3 Return Intelligence

**Components:** `WelcomeBack`, `ReturnSummaryBanner`, `CaughtUpNotice`  
**Implemented:** Restores context, displays what changed while away, and offers a feed catch-up mode.

**Required behavior:**

- Never imply an event that is absent from the return-summary contract.
- Support start, dismiss/seen, and completed catch-up states.
- Avoid duplicating the same item in Welcome Back and Feed catch-up without a clear state transition.

### 6.4 Investor intelligence

**Implemented:** Portfolio overview, health/on-track/risk counts, change feed, attention items, startup detail, authorized evidence, and AI advisory-only explanation.

**Required:**

- Clearly label AI advisory output as advisory.
- Keep canonical metrics and access decisions visibly backend-controlled.
- Preserve investor scope and prevent cross-startup leakage.

### 6.5 Organization intelligence

**Implemented:** Organization health, pulse, risks, actions, KPIs, cohort health, impact, Demo Day, allocation, alumni, and benchmarks.

**Required:**

- Every chart/table needs a last-updated value and empty-state interpretation.
- Risks must include severity and reason.
- Actions must include status and due date where available.
- Advanced tabs must remain capability-gated.

## 7. Recommendation and Matching Surfaces

### Implemented surfaces

- Founder collaborator matching and match results.
- Collaborator opportunity matching.
- Mentor startup recommendations.
- Investor thesis-matched startups.
- Organization talent recommendations.
- Feed and Discovery recommendation cards.

### Card requirements

Every recommendation card should expose:

- Entity type and title.
- Why it was recommended.
- Relevant score or confidence, when contractually available.
- Evidence/reasons in concise language.
- One primary action and optional secondary action.
- Dismiss/hide control where the surface supports feedback.

### Matching access display

The frontend must distinguish:

- **Trust visibility:** how prominently or credibly a profile/startup may appear.
- **Matching breadth:** how many results or recommendations the user can receive.
- **Metered intelligence:** whether a workflow consumes credits or requires subscription entitlement.
- **Scope authorization:** whether the user is allowed to see the underlying evidence.

These are separate concepts and must not be collapsed into one “score.”

## 8. Trust Center Frontend

**Route:** `/founder/trust`

**Implemented:**

- Trust score, tier, verification status, breakdown, badges, expiry, sync date.
- Connected verification sources with refresh/disconnect controls.
- Domain/website challenge flow.
- Founder-only notification preview.
- Append-only Trust timeline and metadata hashes.
- Investor access request review.
- Dismissible note explaining investor visibility, verification, subscriptions, and credits.

**Required UX rules:**

- Explain metadata-only storage and approved sharing scopes.
- Never show raw tokens, secrets, or raw evidence payloads.
- Make expiry and failed verification states actionable.
- Show what is investor-visible versus founder-private.
- Use confirmation for irreversible disconnect/revocation actions.

## 9. TechIT Moments

### Moment prompt

**Component:** `TechitMomentPrompt`  
**Behavior:** Polls for a pending Moment, opens a modal prompt, offers share channels, and supports dismissal.

### Moment card

**Component:** `TechitMomentCard`  
**Content:** Role, title, subtitle, narrative body, sourced metrics, public URL, and share controls.

### Public Moment page

**Route:** `/moments/:slug`  
**Behavior:** Renders the public card, records visits/referrals, and links to signup/diagnostic entry.

### Required Moment rules

- Moments are evidence-backed celebration/share artifacts, not the primary dashboard.
- Prompt copy must explain why the Moment appeared and offer “Share” or “Dismiss.”
- Share channels must degrade to copy-link when direct channel integration is unavailable.
- Public cards must exclude private evidence and show only approved metrics.
- Referral attribution must survive public visit into signup where supported.
- Repeated prompts require server-side status or dismissal semantics; polling alone must not create duplicate prompts.

## 10. Feed, Discovery, Pop Cards, and Soft Notes

### Feed/discovery cards

**Implemented:** Recommendation cards support entity type, reason text, primary/secondary actions, and hide feedback. Feed supports return catch-up and caught-up states.

### Soft notes

Soft notes are contextual, non-blocking explanations. Examples:

- Profile completion reminder.
- Next best action/funding note.
- Matching access note.
- Trust Center importance note.
- AI advisory label.

**Required:**

- Use a concise title or lead sentence.
- State why the note is shown.
- Include a clear action only when one exists.
- Include dismiss control.
- Persist dismissal only for the appropriate audience and time horizon.
- Do not use a soft note for a blocking permission decision.

### Pop cards and modal prompts

Use a modal/pop card only for:

- A user decision that needs focus.
- A share/send workflow.
- A time-sensitive approval or access request.
- A compact, actionable event prompt such as a Moment.

Do not use pop cards for passive metrics, long reports, or recurring intelligence that belongs inline.

## 11. Commercial Access and Metering UX

The frontend must present subscription and credit state without coercive language.

Required elements:

- Current plan and active/inactive status.
- Purchased credits and estimated usage where available.
- Capability name and access decision.
- Why additional funding is relevant now.
- Link to Wallet or Organization Billing.
- Clear distinction between free quota, subscription entitlement, and pay-as-you-go credits.

## 12. Accessibility and Responsive Requirements

- Keyboard-operable navigation, close, refresh, share, and approval controls.
- Accessible labels for icon-only controls.
- Visible focus state.
- Modal focus containment and Escape handling.
- No text overflow in cards, badges, or buttons.
- Stable dimensions for cards, grids, and loading states.
- Mobile-first layouts for all role shells and public cards.

## 13. Frontend Analytics Events

Track, where backend contracts support it:

- Intelligence panel impression, refresh, and action click.
- Soft-note impression, dismiss, and CTA click.
- Recommendation impression, action, hide, and feedback.
- Moment prompt shown, dismissed, shared by channel, public visit, and signup referral.
- Trust source connect, refresh, disconnect, challenge started, and access decision.
- Paywall shown, funding CTA clicked, checkout started, and workflow resumed.

Events must exclude raw evidence, tokens, private notes, and sensitive payloads.

## 14. Frontend Acceptance Criteria

1. All four role shells visibly render daily intelligence when the API returns data.
2. API-only recommendation surfaces have an associated route, panel, card, or action surface.
3. Every soft note can be dismissed without changing underlying state.
4. Trust Center explains investor visibility and the relationship between verification, subscriptions, and credits.
5. Moments can be prompted, dismissed, shared, publicly viewed, and attributed.
6. AI advisory output is visibly labeled and never presented as canonical truth.
7. Capability gates and unauthorized states are clear and recoverable.
8. Public surfaces expose only approved metadata.
9. Frontend build, typecheck, accessibility checks, and route/API contract tests pass.

## 15. Delivery Phases

### Phase A: Preserve and verify

- Maintain current merged routes and shell surfaces.
- Add contract tests for all intelligence and Moment states.
- Audit mobile modal/card behavior.

### Phase B: Consolidate

- Standardize soft-note persistence and dismissal semantics.
- Standardize recommendation-card taxonomy and action instrumentation.
- Add shared access/entitlement summary component.

### Phase C: Optimize

- Improve personalization and explainability.
- Add notification center integration for high-priority intelligence.
- Add product analytics dashboards for surfacing effectiveness.
