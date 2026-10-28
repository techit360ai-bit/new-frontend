# Organization Section Enhancement Plan

## Problem
The Org section currently offers project management + hackathon hosting but lacks the intelligence depth that makes the Investor section compelling. Orgs browse and manage — they don't *investigate* or receive *actionable intelligence* about their portfolio.

## What to Build (Priority Order)

### 1. Cohort Health Dashboard
Aggregate GSIS/EVI/decay across all org startups in a single view.

**Features:**
- Live grid of all cohort startups ranked by GSIS health
- Color-coded health indicators (green/amber/red)
- Decay alerts: "Startup X inactive 12 days"
- GSIS drop alerts: "Startup Y dropped 8 points this week"
- AI-recommended interventions: "Assign mentor," "Schedule check-in," "Recommend pivot workshop"
- Filterable by cohort, stage, risk level
- Weekly health summary (auto-generated)

**Data sources (already exist):**
- GSIS scores per project
- Decay factor computation
- Milestone tracking
- Activity signals (EVI)

---

### 2. Impact Reporting Engine
Auto-generate impact reports from verified execution data for funders, governments, and grant bodies.

**Features:**
- Aggregate metrics: jobs created, revenue generated, products launched, users acquired, milestones hit
- Pre-built report templates: quarterly, annual, program-end
- Export to PDF/DOCX
- KPI tracking against program goals (set targets, measure actual)
- Portfolio-level charts: stage progression, revenue growth, team growth
- Compliance-ready formatting for government/DFI reporting (GIZ, USAID, AfDB, World Bank)

**Data sources (already exist):**
- Project milestones
- Revenue fields (MRR)
- Team size tracking
- Stage progression
- GSIS component trends

---

### 3. Demo Day Pipeline & Investor Matchmaking
Bridge the Org section to the Investor section — curate investor-ready startups and match them.

**Features:**
- Investor-readiness filter: show only startups with GSIS >= threshold
- Readiness checklist per startup: what's missing before demo day
- One-click "Push to Deal Flow" (triggers publishProject for selected startups)
- Investor matching: recommend platform investors by sector/stage/check-size alignment
- Demo day event page builder (date, format, slots)
- Post-demo-day analytics: which startups got watchlisted, which got investor interest

**Data sources (already exist):**
- GSIS scores + investment_score
- Investor profiles (industries, stage preference, check size)
- publishProject / dealFlowSnapshots
- Watchlist data (investorsWatching)

---

### 4. Early Warning / Intervention System
Health monitor for the org's portfolio with AI-driven intervention recommendations.

**Features:**
- Inactivity detection per startup (configurable thresholds)
- GSIS trend monitoring (weekly deltas)
- Milestone deadline tracking (overdue alerts)
- AI-generated intervention recommendations based on weakest GSIS component
- One-click actions: "Send check-in reminder," "Assign to mentor," "Flag for review"
- Intervention history log

---

### 5. Resource Allocation Intelligence
AI analyzes portfolio needs and recommends where to deploy limited resources.

**Features:**
- Portfolio needs analysis: "3 startups need technical help, 2 need fundraising guidance"
- Mentor matching: align mentor expertise with startup gaps
- Office hours scheduling recommendations
- Budget allocation suggestions based on startup potential (GSIS + UPS)
- Utilization tracking: which resources are oversubscribed

---

### 6. Post-Program Alumni Tracking
Track outcomes after program ends — unprecedented for accelerators.

**Features:**
- Alumni dashboard: 6-month, 1-year, 2-year outcomes
- Continued GSIS tracking for graduated startups
- Revenue trajectory post-program
- Fundraising outcomes (if startups raise via platform)
- Re-engagement triggers: "Alumni startup stalling — offer follow-on support?"
- Alumni success stories (auto-surfaced from high-performing graduates)

---

### 7. Cross-Cohort Benchmarking
Compare cohort performance across time to improve program design.

**Features:**
- "Cohort 7 at Week 8 vs Cohort 5 at Week 8" comparison view
- Average GSIS progression curves per cohort
- Milestone velocity comparison
- Program design insights: "Cohorts with weekly check-ins show 23% higher EVI"
- Historical trend charts

---

## Differentiation

| Platform | What they miss |
|----------|---------------|
| F6S | Zero post-acceptance intelligence |
| Gust | No program management |
| Notion/Airtable | No startup-specific scores or AI |
| AngelList | Not built for orgs |

**Our edge:** Verified, AI-computed startup health monitoring across a portfolio, built on data we already compute (GSIS, EVI, milestones, decay, deal-flow).

## Implementation Notes

- Priority 1-3 are highest ROI — buildable from existing data models
- All features use existing scoring (GSIS, EVI, UPS) + existing project/milestone tables
- Backend: mostly new aggregation endpoints in domainService.js + ai-router intelligence
- Frontend: new components inside `/dashboard/organization/section/components/org/`
- Routes: add under `/org/` in App.tsx within OrgLayout

## Resume Command
"Build the Org section enhancements from ORG_SECTION_ENHANCEMENT_PLAN.md. Start with Cohort Health Dashboard."
