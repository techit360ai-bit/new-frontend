# Frontend Scalability Readiness

This repo now ships a CI-safe scalability smoke contract:

```bash
cd frontend
npm run scalability:check
```

By default the command is a dry run. It validates the critical target plan and
the probe caps without contacting external services.

To run against an authorized staging environment:

```bash
cd frontend
SCALABILITY_PROBE_ENABLED=true \
FRONTEND_URL=https://staging.example.com \
VITE_API_BASE_URL=https://ai-router-staging.example.com \
VITE_TECHIT_API=https://backend-staging.example.com/api/mcp \
VITE_MESSAGING_BASE_URL=https://messaging-staging.example.com \
npm run scalability:check
```

The probe is intentionally capped:

- Default concurrency: 2
- Max concurrency: 10
- Default requests per target: 3
- Max requests per target: 25

Evidence required before claiming frontend scalability:

- Staging probe results for the shell, founder dashboard, ai-router health,
  MCP auth boundary, and messaging health.
- Production build and frontend quality gates passing on the same commit.
- p95 latency inside the per-target thresholds in `scripts/scalability-check.mjs`.
- No unexpected 5xx responses during probe runs.
