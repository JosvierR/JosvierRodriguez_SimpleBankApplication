# Staging runbook

Canonical branch: `ReactFrontend-BankApp-Making-RestCall-To-Backend`

Staging branch: `staging`

Production branch: `deploy/vercel-production`

Production is not updated by this runbook.

## What runs where

| Piece | Host | Name |
| --- | --- | --- |
| Frontend | Vercel | `simple-bank-staging` |
| Backend | Render | `simple-bank-api-staging` |
| Database | MongoDB Atlas | `simple_bank_staging` |
| Database user | Atlas | `simple-bank-staging-user` |

The staging Atlas user should be able to read and write only `simple_bank_staging`. Do not point staging at `simple_bank`, `simple_bank_demo`, or `simple_bank_prod`.

## GitHub

Workflows:

- `.github/workflows/ci.yml` — backend tests, frontend quality, Docker build, aggregate check `Required CI`
- `.github/workflows/deploy-staging.yml` — deploys the exact staging SHA after CI succeeds
- `.github/workflows/promote-production.yml` — manual, approval-gated, not part of staging

GitHub environment `staging` accepts deployments from branch `staging` only. Its secrets are deployment credentials and synthetic login passwords. Its variables are `STAGING_API_BASE_URL`, `STAGING_FRONTEND_URL`, and `STAGING_RECIPIENT_ACCOUNT_NUMBER`.

The Atlas URI and the staging JWT secret live only in the Render staging service. They are not GitHub variables, Vercel variables, or repository files.

## Render staging service

- Repository: `JosvierR/JosvierRodriguez_SimpleBankApplication`
- Branch: `staging`
- Runtime: Docker, Dockerfile at the repository root
- Health check path: `/api/public/ready`
- Auto deploy: off

Environment:

| Name | Value |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `staging` |
| `MONGODB_URI` | staging Atlas URI, Render only |
| `MONGODB_DATABASE` | `simple_bank_staging` |
| `JWT_SECRET` | unique Base64 secret, at least 32 random bytes, Render only |
| `JWT_EXPIRATION_MS` | `3600000` |
| `DEMO_SEED_ENABLED` | `false` |
| `DEMO_SEED_RESET` | `false` |
| `BOOTSTRAP_ADMIN_ENABLED` | `false` except during the one-time admin promotion below |
| `BOOTSTRAP_ADMIN_USERNAME` | empty except during that promotion |
| `CORS_ALLOWED_ORIGINS` | the exact staging frontend origin, no wildcard |

Do not set `RENDER_GIT_COMMIT`. Render provides it, and the API exposes it as `revision`.

Generate the deploy hook in Render and store the full URL as the GitHub environment secret `RENDER_STAGING_DEPLOY_HOOK_URL`. The workflow appends `ref=<commit-sha>`.

## Vercel staging project

- Root directory: `frontend`
- Framework: Vite
- Node: 24.x
- Build: `npm run build`
- Output: `dist`

Public variables: `VITE_API_BASE_URL` equal to the staging API base including `/api`, and `VITE_APP_ENV=staging`. Do not put `MONGODB_URI` or `JWT_SECRET` in Vercel.

Deploying with `--prod` inside this project updates the stable staging URL. It does not update the bank production project.

## One-time synthetic admin

Use synthetic identities only: `stg.admin`, `stg.customer.sender`, and `stg.customer.recipient`. Passwords stay in the GitHub staging environment.

1. Register `stg.admin` through the normal register API.
2. Set Render `BOOTSTRAP_ADMIN_ENABLED=true` and `BOOTSTRAP_ADMIN_USERNAME=stg.admin`.
3. Redeploy and verify `stg.admin` is ADMIN.
4. Immediately set `BOOTSTRAP_ADMIN_ENABLED=false` and clear the username.
5. Redeploy and verify the user is still ADMIN.

Then create the sender and recipient bank customers, link their logins, open the synthetic accounts, and fund them through staff APIs. Store the recipient 12-digit account number in `STAGING_RECIPIENT_ACCOUNT_NUMBER`.

## Deploy

Pushing `staging` starts CI. After `Required CI` succeeds, `Staging Deploy` checks out that SHA, deploys Render, waits up to 15 minutes for `/api/public/ready`, deploys Vercel, and runs `scripts/staging-smoke.mjs`.

Readiness must be HTTP 200, `status` `UP`, `environment` `staging`, and `revision` equal to the deployed SHA. Anything else fails the workflow. A failed workflow is not eligible for production.

Manual recovery uses the `workflow_dispatch` trigger on `Staging Deploy`. It still refuses a SHA that does not have a successful CI run.

## Rollback

Fast-forward cannot move `staging` backward. Do not force-reset the branch to roll back the running app.

1. Identify the last SHA whose `staging/deploy` commit status is success.
2. Trigger the Render deploy hook with `ref=<that-sha>`.
3. Redeploy that same SHA to the Vercel staging project, or promote its previous Vercel deployment.
4. Confirm `/api/public/ready` reports that SHA.
5. Fix the bad change on canonical and promote forward.

## Production gate

Do not run `Promote Production` until `docs/staging-acceptance.md` records a `STAGING_APPROVED_SHA` and the production environment has its own API, frontend, database, JWT secret, and approval reviewer. The workflow stops before updating `deploy/vercel-production` when those production settings are absent.
