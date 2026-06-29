# TECHIT Frontend

`new-frontend` is the only active TECHIT frontend. It contains the React/Vite SPA in `frontend/`.

Backend ownership is split across separate repos/services:

- Platform auth, users, and Plugins-MCP routes live in the `BACKEND` repo.
- Go messaging also lives in the `BACKEND` repo.
- AI orchestration lives in the `ai-router` repo.
- `BACKEND/frontend` is migration/reference material only. Move any still-relevant UI fixes here instead of deploying that copy.

## Local Development

```bash
cd frontend
npm install
npm run dev
```

The app expects these Vite env vars when it is not using local defaults:

```bash
VITE_API_URL=https://<backend>/api
VITE_API_BASE_URL=https://<ai-router>
VITE_TECHIT_API=https://<backend>/api/mcp
VITE_MESSAGING_BASE_URL=https://<messaging>
VITE_MESSAGING_WS_URL=wss://<messaging>/ws
```

## CI and Deployment

The frontend GitHub Actions workflow lives in `.github/workflows/frontend.yml` in this repo. It installs `frontend/`, runs `npm run build`, and triggers the frontend Render deploy hook from `main`.

The stale frontend deploy workflow that used to live in `BACKEND` is intentionally disabled; backend workflows remain in `BACKEND`.
