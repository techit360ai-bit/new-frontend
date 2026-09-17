# Deployment notes

`new-frontend` is the React/Vite SPA and the only active frontend. It has no backend of its own; it calls three separate services. Configure these via Vite env vars at build time:

| Env var | Points at | Notes |
|---|---|---|
| `VITE_API_URL` | `https://backend.techitnetwork.com/api` | The platform Node service (`BACKEND` repo). Serves `/auth/*`, `/users/me`. |
| `VITE_API_BASE_URL` | `https://api.techitnetwork.com` | The Python FastAPI AI orchestrator. Serves `/api/v1/*`. |
| `VITE_TECHIT_API` | `https://backend.techitnetwork.com/api/mcp` | The Plugins-MCP mount on the same Node service as `VITE_API_URL`. |
| `VITE_MESSAGING_BASE_URL` | `https://messaging.techitnetwork.com` | The Go messaging service. Serves `/api/v1/conversations`, `/channels`, `/posts`, `/demos`. |
| `VITE_MESSAGING_WS_URL` | `wss://messaging.techitnetwork.com/ws` | WebSocket gateway on the same Go service. |

All three backends must share the same `JWT_SECRET` so tokens issued by `BACKEND/api/auth/signin` verify on the AI router (`get_user_context` in `main.py`), the Go messaging service (`internal/auth/jwt.go`), and the MCP routes (`Plugins-MCP/server/mount.ts` `resolveActor`).

Local dev defaults assume:
- BACKEND on `http://localhost:3000`
- ai-router on `http://localhost:8000`
- Go messaging on `http://localhost:8080`

There is **no Node backend inside this repo** — the previous `backend/` folder was a dead stub leftover from an earlier commit and has been removed. The Node service lives in the [BACKEND repo](https://github.com/techit360ai-bit/BACKEND).

`BACKEND/frontend` is reference-only migration material. Frontend fixes and deploy workflows belong in this repo.
