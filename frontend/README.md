# Simple Bank Frontend

React 19 + TypeScript operations UI for the Simple Bank Spring Boot API.

## Commands

```powershell
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Local development uses `VITE_API_BASE_URL=/api`; Vite proxies `/api` to `http://localhost:8080`. Copy `.env.example` only when a local override is useful. Vite variables must never contain a MongoDB URI, JWT signing secret, or password.

Authentication tokens are stored only in `sessionStorage`. Language preference is stored only in `localStorage`. The frontend verifies a stored token with the backend on startup and treats the verified username and roles as authoritative. Frontend-owned interface copy is localized in English, Spanish, and French.

The production Docker image builds the Vite bundle and serves only `dist/` from Nginx. Nginx provides SPA fallback, long-lived caching for hashed assets, no-cache behavior for `index.html`, and an `/api/` reverse proxy to `http://backend:8080`.
