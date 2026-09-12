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
VITE_API_URL=https://backend.techitnetwork.com/api
VITE_API_BASE_URL=https://api.techitnetwork.com
VITE_TECHIT_API=https://backend.techitnetwork.com/api/mcp
VITE_MESSAGING_BASE_URL=https://messaging.techitnetwork.com
VITE_MESSAGING_WS_URL=wss://messaging.techitnetwork.com/ws
```

## CI and Deployment

The frontend GitHub Actions workflow lives in `.github/workflows/frontend.yml` in this repo and runs the quality gates. Production deployment is handled by `.github/workflows/deploy.yml`, which publishes the build to the AWS S3 bucket and invalidates CloudFront.
