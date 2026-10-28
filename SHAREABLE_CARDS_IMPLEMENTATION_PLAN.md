# Implementation Plan: Shareable Moment Cards & Smart Notification Cards

**Scope:** Extension of TechIT Network's existing product architecture to introduce a reusable Shareable Moment Cards and Smart Notification Cards capability supporting the 8 required card types without new dashboards, sidebars, or duplicate architectures.

---

## 1. Architecture & Reused Components

| Capability | Existing Component / Route | Extension Strategy |
|---|---|---|
| **Sharing & Modals** | `ShareModal.tsx`, native `navigator.share`, social intents | Extend `ShareModal` or create a generic `ShareableCardModal` supporting image export previews and social networks (WhatsApp, LinkedIn, X, Facebook, Telegram). |
| **Notifications** | `NotificationsPanel.tsx`, `NotificationsPage.tsx`, `notifications.ts` | Extend notification rendering to support smart notification card variants (Action Required, Collaboration Opportunity, Investor Opportunity, Organization). |
| **Feed & Dashboard** | `FeedPage.tsx`, `FounderDashboard`, `Workspace` | Embed shareable moment cards (Founder Milestone, Startup Progress, Founder Identity, Collaborator Recognition, AI Insight) into existing feed posts and founder/collaborator summaries. |
| **Design System** | CSS variables (`--surface-primary`, `--accent-primary`, etc.), Tailwind | Utilize existing color tokens, dark navy backgrounds, electric blue accents, and typography. |

---

## 2. Card Library (8 Initial Card Types)

### Category A: Shareable Moment Cards (Celebration & Intelligence Modes)
1. **Founder Milestone Card:** Celebrates verified startup execution milestones (idea evaluation, market validation, MVP development, first collaborator).
2. **Startup Progress Card:** Visualizes founder startup journey and milestone completion status.
3. **Founder Identity Card:** Professional founder profile introduction for co-founders, collaborators, and investors.
4. **Collaborator Recognition Card:** Highlights accepted deliverables and verified project contributions.
5. **AI Insight Card:** Makes selected TechIT AI-generated startup insights and next steps shareable.

### Category B: Smart Notification Cards (Action Mode)
6. **Action Required Notification Card:** Prompts users to complete startup assessments, review AI recs, or submit progress reports.
7. **Collaboration Opportunity Notification Card:** Notifies users of matching collaboration opportunities and co-founder invitations.
8. **Investor Opportunity Notification Card:** Provides investors with relevant, authorized startup updates and match reasons.

---

## 3. Implementation Steps

1. **Create Reusable Card Renderer Component (`ShareableCard.tsx`)**:
   - Supports 3 visual modes: Celebration, Intelligence, Action.
   - Renders responsive in-app cards and exportable layout wrappers.
2. **Create Share & Preview Modal (`ShareableCardModal.tsx`)**:
   - Integrates with existing `ShareModal` mechanics (Copy link, WhatsApp, LinkedIn, X, Telegram).
3. **Integrate with Notifications & Feed**:
   - Extend `NotificationsPanel.tsx` and feed rendering to display smart notification cards and shareable moment cards.
4. **Automated Testing & Build Verification**:
   - Verify TypeScript compilation and test suite passing.
