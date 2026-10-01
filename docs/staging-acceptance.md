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
| STAGING_APPROVED_SHA | `f4e5471b8287413fab6037c7abc52640bced0d84` |
| Backend URL | https://simple-bank-api-staging.onrender.com |
| Frontend URL | https://simple-bank-staging.vercel.app |
| Health | 200, environment `staging` |
| Ready | 200, status `UP` |
| Environment | `staging` |
| Revision | `f4e5471b8287413fab6037c7abc52640bced0d84` |
| Customer login | `stg.customer.sender` HTTP 200 |
| Admin login | `stg.admin` HTTP 200, and still ADMIN after bootstrap was turned off |
| Dashboard | HTTP 200 |
| Accounts | sender checking `224892789540` and savings `242273814917`; recipient checking `121927304771` |
| Transfer preview | HTTP 200, destination masked, ending in 4771 |
| Manual transfer | `TRF-68A0F061680B` for 1.00; sender checking 3200.00 to 3199.00; recipient checking 2500.00 to 2501.00; `TRANSFER_OUT` and `TRANSFER_IN` share that reference |
| Ownership 404 | customer read of the recipient account and its history returned 404 |
| CORS | `https://simple-bank-staging.vercel.app` allowed; `https://evil.example` not allowed |
| EN / ES / FR | not clicked in a browser during this run |
| Responsive | not checked at 390px during this run |
| Staging workflow run | not run; the branch has not been fast-forwarded |

`scripts/staging-smoke.mjs` passed against those URLs for revision `f4e5471b8287413fab6037c7abc52640bced0d84`. The Atlas user `simple-bank-staging-user` has `readWrite` on `simple_bank_staging` only and is scoped to cluster `Bank-Project`. Production branch `deploy/vercel-production` stays at `0bf185c6e1b875d98f30f20b7e9f7619d43d980d` until a human runs the manual production workflow.
