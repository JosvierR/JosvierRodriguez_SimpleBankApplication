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

The API needs its own HTTPS host. This repository does not select that host. Live staging and production stay blocked until `STAGING_API_BASE_URL` and `PRODUCTION_API_BASE_URL` exist.

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

`CORS_ALLOWED_ORIGINS` is the exact staging frontend origin, for example `https://simple-bank-staging.vercel.app`.

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

`GET /api/public/health` returns `status` and `environment`. It is the deployment smoke check. Neither response includes a database URI, a database name, or a secret.

The authenticated shell and the public header show a Staging badge only when `environment` is `staging`.

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
