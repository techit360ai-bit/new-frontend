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
NODE_BACKEND_URL=https://backend-staging.example.com/api \
AI_ROUTER_BASE_URL=https://ai-router-staging.example.com \
VITE_TECHIT_API=https://backend-staging.example.com/api/mcp \
VITE_MESSAGING_BASE_URL=https://messaging-staging.example.com \
npm run scalability:check
```

`VITE_API_URL` remains supported as the frontend backend API env when
`NODE_BACKEND_URL` is not set. `VITE_API_BASE_URL` remains supported as the
frontend ai-router env when `AI_ROUTER_BASE_URL` is not set.

Admin dashboard/API probes are optional and only run when explicitly provided.
Do not reuse `AI_ROUTER_BASE_URL` or `VITE_API_BASE_URL` as an admin API URL:

```bash
ADMIN_DASHBOARD_URL=https://admin-staging.example.com \
ADMIN_API_BASE_URL=https://admin-api-staging.example.com \
ADMIN_API_BEARER_TOKEN=optional-admin-smoke-token \
npm run scalability:check
```

The probe is intentionally capped:

- Default concurrency: 2
- Max concurrency: 10
- Default requests per target: 3
- Max requests per target: 25

Evidence required before claiming frontend scalability:

- Staging probe results for the shell, founder dashboard, Node backend root,
  ai-router health, MCP auth boundary, messaging health, admin dashboard, and
  admin API health when those URLs are available.
- Production build and frontend quality gates passing on the same commit.
- p95 latency inside the per-target thresholds in `scripts/scalability-check.mjs`.
- No unexpected 5xx responses during probe runs.
