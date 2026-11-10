# Technical Implementation Plan: Extending TechIT Opportunity Center & Deliverables Execution

**Date:** October 27, 2026  
**Scope:** Extension of TechIT Network's existing Opportunity Center, role-aware opportunity submission/posting, idea evaluation workflow split, paid-gig KYC/subscription/credit rules, and deliverables-based execution tracking.

---

## 1. Executive Summary

This plan outlines the architecture and implementation steps to extend TechIT Network's existing Opportunity Center into a verified, role-aware opportunity distribution and participation system complete with deliverables-based execution tracking.

In accordance with product guidelines:
- **No new sidebar features or duplicate dashboards** are added.
- **Explorers/Users** cannot post opportunities (posting is restricted to Founders, Collaborators, Investors, and Organizations with proper authorization/verification).
- **Founders** can list startup-related opportunities for free without requiring a paid subscription or credits.
- **Paid Gigs** require full platform KYC and an active qualifying subscription (with allowance for users who activate credit purchase alongside KYC).
- **No per-application fees** or hidden credit deductions for applying.
- **Merit within eligibility tiers**: spending more does not bypass eligibility or put paying users ahead of better-qualified candidates.
- **Deliverables Execution Workflow**: Post-selection tracking of agreed deliverables, progress submissions, review/feedback, completion, and integration with the Execution Reputation Graph.

---

## 2. Existing Architecture & Component Reuse

| System Component | Existing Path / Asset | Extension Strategy |
|---|---|---|
| Opportunity Center | `new-frontend/frontend/src/dashboard/_shared/opportunities/`, `OpportunityHub.tsx`, `OpportunityCard.tsx`, `OpportunityDetail.tsx` | Extend `OpportunityHub` with "Post an Opportunity" button, role filtering, verification badges, and "Manage Opportunities" view. |
| Opportunity APIs | `new-frontend/frontend/src/lib/api/opportunities.ts`, Node backend `/api/opportunities`, AI Router opportunity services | Extend opportunity creation & management endpoints to support category-specific fields, deliverables schema, and verification state. |
| Role Management | `AuthContext`, `UserContext`, role definitions | Enforce role permissions server-side and client-side (Explorers/Users cannot post; Founders can post startup opportunities for free). |
| Idea Evaluation | Founder incubation & idea diagnostic workflows | Split output into two explicit actions: **Find Collaborators** (invokes existing matching) and **List an Opportunity** (opens prefilled opportunity form). |
| KYC & Billing | Existing KYC state machine & subscription/credit entitlements | Gate paid-gig participation on `kyc_status === 'approved'` and active qualifying subscription (or credit activation token). |
| Trust Engine & Verification | `BACKEND/backend/src/services/trust*`, `ai-router/trust_*` | Apply verification stages (identity, organization, poster authorization, opportunity authenticity, terms) and badges. |
| Workspaces | Existing Workspace infrastructure & task management | Connect accepted opportunity engagements to Workspace for task execution, progress updates, and artifact sharing. |

---

## 3. Role-Aware Posting & Permissions Matrix

| Role | Can Post Opportunities? | Permitted Opportunity Categories | Verification / Requirements |
|---|---|---|---|
| **Founder** | Yes | Startup team openings, co-founder calls, paid tech/non-tech gigs, project collaborations, internships, challenges, customer discovery | Free startup listing for verified/evaluated startup; poster verification |
| **Collaborator** | Yes | Paid project opportunities authorized to offer, collaboration requests, professional project opportunities, challenges | Requires active collaborator status & authorization |
| **Investor** | Yes | Investment mandates, funding programmes, office hours, pitch calls, co-investment opportunities | Verified investor credentials & compliance check |
| **Organization** | Yes | Jobs, internships, paid gigs, grants, competitions, training, incubation programmes, hackathons | Verified organization account & administrator permissions |
| **User / Explorer** | **No** | None (read, browse, apply to eligible opportunities subject to rules) | Cannot post opportunities |

---

## 4. Founder Workflow: Idea Evaluation Split

After idea evaluation in the Founder incubation hub:
1. **Action A: Find Collaborators**
   - Invokes existing collaborator matching & discovery workflow.
   - Does not publish a public opportunity.
2. **Action B: List an Opportunity**
   - Opens the existing opportunity creation modal/form prefilled with idea/startup name, problem statement, solution, required skills, and startup context.
   - **Fee Rule:** Founders are **not** required to purchase a subscription or credits to list an eligible startup-related opportunity.

---

## 5. Paid Gigs, KYC, Subscriptions, and Credit Entitlements

- **Discovery:** All eligible users can discover published paid gigs.
- **Application/Participation Requirements for Paid Gigs:**
  1. Full platform KYC completed and approved (`kyc_status === 'approved'`).
  2. Active qualifying subscription **OR** qualifying credit purchase activation (alongside KYC).
  3. No application fees.
- **Fairness:** Within eligible participant tiers, ranking prioritizes skills, experience, project history, and relevance. Spending more never bypasses eligibility or grants automatic placement over better-qualified candidates.

---

## 6. Deliverables Tracking & Execution Workflow

When a creator selects a collaborator for an opportunity, an **Engagement** is created.
- **Lifecycle:** Draft → Agreed → Active → Completed / Disputed.
- **Deliverables Entity:**
  - Title, description, assigned owner (collaborator), acceptance criteria, due date, weight, status (`not-started`, `in-progress`, `submitted`, `approved`, `changes-requested`, `blocked`).
- **Submissions & Review:**
  - Collaborators submit progress evidence (links, files, PRs, notes).
  - Creators review: Approve, Request Changes (with feedback), or Raise Dispute.
- **Reputation Integration:**
  - Completed and accepted deliverables contribute verified evidence to TechIT's Execution Reputation Graph.

---

## 7. Implementation Steps

1. **Backend Extensions:**
   - Extend opportunity model in Node/AI Router to store `deliverables`, `engagement_status`, `verification_details`, and `payment_terms`.
   - Add API routes for engagement creation, deliverables CRUD, progress submission, and review/approval.
2. **Frontend UI Extensions:**
   - Enhance `OpportunityHub` with a prominent **Post an Opportunity** action (gated by role; blocked for Explorers/Users).
   - Add **Manage Opportunities** / **Track Deliverables** views within the Opportunity Center and Workspace.
   - Implement the idea evaluation split (Find Collaborators vs. List an Opportunity).
   - Add eligibility checks for paid gigs (KYC + subscription/credit validation).
3. **Testing & Verification:**
   - Write automated unit and integration tests covering role posting rules, founder free listing, paid-gig KYC/subscription gating, and deliverables workflow.
