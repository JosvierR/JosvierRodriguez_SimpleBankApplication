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

`ACCEPTED_RUNTIME_SHA` is the application commit that staging is running. A later documentation commit is recorded separately and is not this SHA.

| Item | Value |
| --- | --- |
| Date | 2026-10-01 |
| ACCEPTED_RUNTIME_SHA | `ab422dc4bc7b2cd680e38e889e747ac0536dc925` |
| Canonical CI | https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/36943343343 SUCCESS |
| Staging Deploy | https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/36943523075 SUCCESS |
| Backend URL | https://simple-bank-api-staging.onrender.com |
| Frontend URL | https://simple-bank-staging.vercel.app |
| Health | PASS |
| Ready | PASS, status `UP` |
| Environment | `staging` |
| Revision | `ab422dc4bc7b2cd680e38e889e747ac0536dc925` |
| Smoke | PASS |
| Customer | PASS, `stg.customer.sender` |
| Admin | PASS, `stg.admin` opens Administration and is not shown as a banking customer |
| Dashboard | PASS in Chromium |
| Accounts | PASS, sender checking `224892789540` and savings `242273814917` shown in full |
| Account details | PASS, full owned number and balance |
| Transfer form | PASS, source shows type, full owned number, and balance |
| Transfer preview | PASS, recipient `Staging R.` and masked number ending 4771 |
| Copy account number | PASS, confirmation shown |
| Manual transfer | already verified via `TRF-68A0F061680B` |
| Ownership | PASS |
| CORS | PASS |
| EN | PASS |
| ES | PASS |
| FR | PASS |
| Responsive | PASS at 1440x900, 1280x800, 1024x768, 768x1024, 430x932, 390x844, and 360x800 |
| Browser console | no critical application errors |
| API host | `simple-bank-api-staging.onrender.com`; no request targeted localhost |
| Screenshots | `docs/screenshots/final-staging/` |

Chromium opened the live staging frontend. English, Spanish, and French rendered translated labels, including account number, copy, copied confirmation, and the 12-digit hint, with no raw translation keys. Dashboard, accounts, transfer, and transfer preview had no horizontal overflow at the viewports above. Balances and owned account numbers stayed readable. The preview did not show the full foreign account number, a foreign balance, a foreign internal id, or foreign history. No second transfer was submitted.

`scripts/staging-smoke.mjs` passed inside staging deploy `36943523075` for revision `ab422dc4bc7b2cd680e38e889e747ac0536dc925`. The Atlas user `simple-bank-staging-user` has `readWrite` on `simple_bank_staging` only and is scoped to cluster `Bank-Project`. Production branch `deploy/vercel-production` stays at `0bf185c6e1b875d98f30f20b7e9f7619d43d980d` until a human runs the manual production workflow.
