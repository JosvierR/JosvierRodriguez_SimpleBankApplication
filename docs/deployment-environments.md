# Deployment environments

The same source runs in four environments. The difference is configuration.

| Environment | Database | Seed | Frontend |
| --- | --- | --- | --- |
| Local | `simple_bank` | off | `http://localhost:5173` through the Vite `/api` proxy |
| Demo | `simple_bank_demo` | on | `http://localhost:3000` through the Nginx `/api` proxy |
| Staging | `simple_bank_staging` | off | Vercel project `simple-bank-staging` |
| Production | `simple_bank_prod` | off | Vercel project `simple-bank-production` |

Staging must not use the production database. Production must not use the demo database. Demo seed reset never targets `simple_bank`, `simple_bank_staging`, or `simple_bank_prod`.

## Hosting split

Vercel hosts the React frontend only. It does not host this Spring Boot API.

```text
Browser
  ↓
Vercel React
  ↓ HTTPS
Spring Boot API
  ↓
MongoDB Atlas
```

The API is hosted on Render. Staging is `simple-bank-api-staging`. Production is `simple-bank-api-production`.

## Live URLs

| Environment | Frontend | API |
| --- | --- | --- |
| Production | https://simple-bank-production.vercel.app | https://simple-bank-api-production.onrender.com/api |
| Staging | https://simple-bank-staging.vercel.app | https://simple-bank-api-staging.onrender.com/api |
| AWS | https://d1sh3vurxc4laf.cloudfront.net | `https://d1sh3vurxc4laf.cloudfront.net/api` |

Vercel project `simple-bank-staging` builds `frontend` with Node 24, `npm run build`, and output `dist`. Its API base is `https://simple-bank-api-staging.onrender.com/api` and `VITE_APP_ENV=staging`. Production uses the production Render API and `VITE_APP_ENV=production`. Tokens stay in GitHub environment secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_STAGING_PROJECT_ID`, and `VERCEL_PRODUCTION_PROJECT_ID`. Render hooks are `RENDER_STAGING_DEPLOY_HOOK_URL` and `RENDER_PRODUCTION_DEPLOY_HOOK_URL`.

## Staging

```text
staging branch
  ↓
Vercel project simple-bank-staging
  ↓
staging backend URL
  ↓
simple_bank_staging
```

`SPRING_PROFILES_ACTIVE=staging`

`MONGODB_DATABASE=simple_bank_staging`

`DEMO_SEED_ENABLED=false`

`CORS_ALLOWED_ORIGINS` is the exact staging frontend origin `https://simple-bank-staging.vercel.app`.

The live staging API is https://simple-bank-api-staging.onrender.com. The live staging frontend is https://simple-bank-staging.vercel.app. Auto-deploy on the Render service is off. The service is in Virginia on the free plan, and its health check is `/api/public/ready`.

The Vercel project uses root directory `frontend`, production branch `staging`, `npm run build`, and output `dist`. Public variables are `VITE_API_BASE_URL` and `VITE_APP_ENV=staging`. Do not put `MONGODB_URI` or `JWT_SECRET` in Vercel.

## Production

```text
deploy/vercel-production branch
  ↓
Vercel project simple-bank-production
  ↓
production backend URL
  ↓
simple_bank_prod
```

`SPRING_PROFILES_ACTIVE=production`

`MONGODB_DATABASE=simple_bank_prod`

`DEMO_SEED_ENABLED=false`

`CORS_ALLOWED_ORIGINS` is the exact production frontend origin. The production JWT secret is different from the staging secret. Do not seed demo users and do not set `DEMO_SEED_RESET` against production.

Promotion is a fast-forward of an approved staging commit. No feature commits land directly on `staging` or `deploy/vercel-production`.

## Two Vercel projects

Two projects give a stable staging URL, a stable production URL, separate API targets, and a lower chance of mixing environment variables. Preview URLs are not the environment boundary. `*.vercel.app` is not an allowed CORS origin.

## Database users

Prefer a separate Atlas user for each environment:

- `simple-bank-staging-user` can read and write only `simple_bank_staging`
- `simple-bank-production-user` can read and write only `simple_bank_prod`

One cluster is acceptable when those users cannot cross databases. Credentials stay outside git.

## Public configuration

`GET /api/public/config` returns `demoMode`, `environment`, `registrationEnabled`, and `supportedLanguages`. `environment` is `local`, `demo`, `staging`, or `production`.

`GET /api/public/health` is process liveness. It returns `status` and `environment` and does not ping MongoDB.

`GET /api/public/ready` is deployment readiness. It pings MongoDB and returns `status`, `environment`, and `revision`. MongoDB down is HTTP 503 with `status` `DOWN`. A successful staging answer is HTTP 200:

```json
{"status":"UP","environment":"staging","revision":"<commit-sha>"}
```

`revision` comes from `APP_REVISION`, then Render's `RENDER_GIT_COMMIT`, then `local`. Neither public response includes a database URI, database name, host, username, password, or JWT secret.

Render binds `PORT`. `server.port=${PORT:8080}` keeps local and Docker on 8080.

The authenticated shell and the public header show a Staging badge only when `environment` is `staging`.

## Promotion

Canonical branch `ReactFrontend-BankApp-Making-RestCall-To-Backend` is the source of truth. `staging` is the tested promotion branch. `deploy/vercel-production` receives an approved staging SHA only.

```text
canonical
  ↓ CI green, fast-forward
staging
  ↓ Staging Deploy workflow
Render + Vercel staging
  ↓ manual Promote Production workflow, after approval
deploy/vercel-production
```

GitHub Actions workflow `CI` runs backend tests, frontend quality, and Docker image builds. The stable check name is `Required CI`.

`Staging Deploy` runs only after CI succeeds on `staging`. It checks out that exact commit, calls the Render deploy hook with `ref=<sha>`, waits until `/api/public/ready` reports that SHA, deploys the separate Vercel project `simple-bank-staging`, and runs `scripts/staging-smoke.mjs`.

`Promote Production` is `workflow_dispatch` only. It refuses to run unless the input SHA is `origin/staging`, that SHA has a successful `staging/deploy` status, and `deploy/vercel-production` can fast-forward to it. The production job uses the GitHub `production` environment so approval can stop the run before any branch update. This task does not execute that workflow.

Demo seed stays off for staging and production. The twenty-user demo remains `simple_bank_demo` only.

Rollback does not rewrite Git history. Redeploy the last known-good commit on Render and the last known-good deployment on Vercel, then fix canonical forward. See [staging-runbook.md](staging-runbook.md) and [staging-acceptance.md](staging-acceptance.md).

## Branch model

Historical coursework snapshots:

- `bankapp-Java-Springboot-Backend-API-MVC`
- `SpringbootRESTApiBackend-With-DB-MongoDBCloudAtlas`
- `SpringbootRESTApiBackend-With-DB-MongoDBCloudAtlas-With-JWT`

Canonical application:

- `ReactFrontend-BankApp-Making-RestCall-To-Backend`

Release branches, same code as canonical at promotion time:

- `staging`
- `deploy/vercel-production`
