# Collaborator Matching Gap Review — 2026-08-14

## Current state

- The live collaborator directory was previously alphabetical rather than ranked.
- The AI Router `MatchingAgent` uses hard-coded example candidates and is not connected to the authenticated profile directory.
- Collaboration requests previously contained no project, role, scope, skill or compensation context.
- There is no accepted-invite, completed-work or founder-satisfaction feedback loop.

## Implemented low-cost improvement

The directory now ranks real, disclosed profile fields with a deterministic rule set. No custom ML pipeline or inferred personality/quality score is used. Founders can also broadcast an ownership-focused collaboration call to collaborator and/or founder Opportunity Hubs; the persisted audience schema already reserves `explorer` for a future role.

| Signal | Maximum weight |
| --- | ---: |
| Requested role and required-skill coverage | 40 |
| Weekly availability, earliest start and commitment style | 20 |
| Proposed ownership, with optional cash support, compared with disclosed preferences | 20 |
| Credibility score | 10 |
| Verified profile | 5 |
| Timezone/location and industry overlap | 5 |

The UI shows a bounded score and concrete reason codes. Missing profile data earns no points rather than receiving an invented value.

## Remaining gaps and recommendations

1. Add founder-selectable hard filters for minimum availability, start date and required skills before ranking. Keep ownership prominent; use cash only as optional support or a founder-selected exception.
2. Track invitation viewed, accepted/declined, project joined, milestone completed and both-side satisfaction outcomes. Do not train a model until this data is large enough and consented.
3. Improve sparse-profile handling by prompting collaborators to complete availability, compensation and capability fields; show profile completeness separately from match fit.
4. Add synonym/ontology mapping for equivalent skills such as `Node`, `Node.js` and `backend JavaScript`. Start with a maintained dictionary; consider third-party embeddings later only if semantic misses become material.
5. Monitor exposure and acceptance rates by region and other legally permitted cohorts. Audit for popularity loops caused by credibility and verification weights.
6. Replace or remove the disconnected hard-coded AI Router matcher so there is one authoritative matching path.
7. Add invitation expiry, withdrawal, decline reasons and anti-spam/rate limits before high-volume outreach.

## ML recommendation

Do not build a custom ML service now. The transparent rules are cheaper to operate, explainable to users and appropriate while outcome labels are sparse. Revisit managed semantic matching only after sufficient real invite and collaboration outcomes exist.
