# Frontend Security Change Protocol

The frontend is never an authorization authority. Route guards improve user
experience only; every read and mutation must use the canonical backend API,
send the backend credential through the shared API client, and handle 401/403
without inventing fallback data.

Changes touching auth, tokens, workspace/org routes, uploads, AI tools, wallet,
or admin views must include an allow/deny test and must not expose secrets in
`VITE_*` variables or bundles. The planned token migration is Secure,
HttpOnly, SameSite cookies plus CSRF protection; do not add new localStorage
credential usage while that migration is pending.
