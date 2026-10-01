# Staging acceptance

This page records whether a staging SHA is eligible for a later production promotion. It does not contain passwords, tokens, database URIs, or JWT secrets.

## Required automated checks

`scripts/staging-smoke.mjs` must pass against the deployed staging URLs:

| Check | Expected |
| --- | --- |
| `GET /api/public/health` | 200, environment `staging` |
| `GET /api/public/ready` | 200, status `UP`, revision equals the deployed SHA |
| `GET /api/public/config` | environment `staging`, `demoMode` false |
| Frontend `/`, `/login`, `/app` | 200 and the SPA shell |
| Staging badge | shipped in the frontend and driven by public config |
| CORS | exact staging origin allowed, `https://evil.example` not allowed |
| Customer login, `/api/me`, `/api/dashboard`, `/api/me/accounts` | 200 |
| Customer `/api/admin/whoami` | 403 |
| Admin login and `/api/admin/whoami` | 200 |
| `POST /api/me/transfers/preview` | 200, masked destination, no destination id, balance, or history |
| Customer read of the recipient account and history | 404 |

Automated deploys use preview only. They do not submit a transfer.

## Manual transfer

Before any production promotion, send one synthetic transfer from the sender account to the recipient account number.

Confirm:

- sender balance decreases by the amount
- recipient balance increases by the same amount
- sender history contains `TRANSFER_OUT`
- recipient history contains `TRANSFER_IN`
- both rows share one `transferReference`
- the sender still receives 404 when reading the recipient account and its history directly

## Languages and layout

On the deployed staging frontend, confirm English, Spanish, and French, a desktop width, and a 390px width. Owned account numbers stay fully visible. The transfer form shows the customer's own account number and masks the destination.

## Recorded result

| Item | Value |
| --- | --- |
| Date | 2026-10-01 |
| STAGING_APPROVED_SHA | not approved |
| Backend URL | not deployed |
| Frontend URL | not deployed |
| Health | not run against a host |
| Ready | not run against a host |
| Environment | not run against a host |
| Revision | not run against a host |
| Customer login | not run |
| Admin login | not run |
| Dashboard | not run |
| Accounts | not run |
| Transfer preview | not run |
| Manual transfer | not run |
| Ownership 404 | not run |
| CORS | not run against a host |
| EN / ES / FR | not run against a host |
| Responsive | not run against a host |
| Staging workflow run | not recorded |

Staging acceptance stays blocked until Atlas `simple_bank_staging`, the Render service, and the Vercel staging project exist. Production branch `deploy/vercel-production` stays unchanged until this table names an approved SHA and a human runs the manual production workflow.
