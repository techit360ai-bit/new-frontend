# Frontend debug access (temporary, reversible)

## Why F12 "does not work"

The production frontend is a **minified bundle served from S3 + CloudFront**
(`beta.techitnetwork.com`). There is **no CSP, no anti-devtools script, and no
server-side hook** that can block DevTools — the browser owns F12. So:

- If F12 literally does nothing, it is a **browser/extensions/enterprise policy**
  on that machine (managed Chrome/Edge via MDM, or an extension). Fix: use an
  unmanaged browser or a portable Chrome profile, or ask IT to allow it.
- The real obstacle is that normal builds ship **without source maps**, so the
  Sources panel shows minified code. That is the "hardening" to work around.

Nothing here weakens authentication or the API. Do **not** paste tokens into
shared chats; debug only with a throwaway test account.

## Option A — run the SPA locally against the production API (recommended)

Gives full source maps, breakpoints, and React DevTools without publishing
anything.

```bash
cd new-frontend/frontend
npm ci
VITE_API_URL=https://backend.techitnetwork.com/api npm run dev   # http://localhost:5173
```

Sign in with a **test account**. If the browser blocks the cross-origin call,
add `http://localhost:5173` to the backend's `CORS_ORIGINS` for the debugging
window, then remove it.

## Option B — temporary source-mapped build on a private path

Only when the bug only reproduces on the deployed bundle.

1. Build with source maps enabled:

   ```bash
   cd new-frontend/frontend
   VITE_BUILD_SOURCEMAP=1 npm run build      # emits dist/**/*.js.map
   ```

2. Deploy it to a **separate, access-controlled** location — never the public
   bucket root (a `.map` file reveals the full source):

   ```bash
   aws s3 sync dist s3://<FRONTEND_S3_BUCKET>/debug/ --delete \
     --cache-control "no-store"
   ```

   Access-control options (pick one):
   - a **CloudFront signed URL / signed cookie** in front of `/debug/*`, or
   - a temporary **S3 bucket policy** allowing only the DevOps IAM role +
     CloudFront OAC, or
   - put `/debug/*` behind the existing auth proxy.

3. Debug at `https://beta.techitnetwork.com/debug/` (add a CloudFront behavior
   for `/debug/*` if needed).

4. **Revert immediately when done** (this is the important step):

   ```bash
   aws s3 rm s3://<FRONTEND_S3_BUCKET>/debug/ --recursive
   aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/debug/*"
   ```

   On the next normal deploy the bundle is source-map-free again; confirm with
   `curl -sI https://beta.techitnetwork.com/assets/index-*.js.map` → `403/404`.

## Option C — debug the minified bundle in place

No deploy needed. In DevTools: **Network** tab → reproduce the failing action →
right-click the request → *Copy as cURL*; use the **Console/Application** tabs.
Breakpoints still work — you just read minified names, so pair this with the
React DevTools extension and the Network tab.

## Checklist

- [ ] Throwaway test account, never a real user.
- [ ] Source maps are behind signed URLs / an authenticated path.
- [ ] `/debug/*` removed and invalidated after the session.
- [ ] `CORS_ORIGINS` change (Option A) reverted.
