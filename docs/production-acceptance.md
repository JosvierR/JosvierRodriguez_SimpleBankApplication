# Production acceptance

This page records the production promotion of the approved staging SHA. It does not contain passwords, tokens, database URIs, or JWT secrets.

## Recorded result

| Item | Value |
| --- | --- |
| Date | 2026-10-02 |
| Accepted runtime SHA | `1e8323d1f83458a9488a916f1d65db5bf017db6c` |
| Canonical, staging, and production at promotion | `1e8323d1f83458a9488a916f1d65db5bf017db6c` |
| Promotion workflow | https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/36957841488 SUCCESS |
| Approval | completed by the production environment reviewer |
| Fast-forward | `0bf185c6e1b875d98f30f20b7e9f7619d43d980d` to `1e8323d1f83458a9488a916f1d65db5bf017db6c`, no merge commit |
| Render URL | https://simple-bank-api-production.onrender.com |
| Render deploy ID | `dep-davhnc1srm7s73c23dqg` |
| Render hook | HTTP 200 during the promotion; the service was already live on this SHA |
| Vercel URL | https://simple-bank-production.vercel.app |
| Vercel deployment ID | `dpl_GEDLHcwmZDsLoMeoknHWMtEpWZjH` |
| Vercel project | `prj_WrGbS4OOJBKAyuryDfoXj54TgSLx` |
| Health | PASS |
| Ready | PASS, status `UP` |
| Revision | PASS, `1e8323d1f83458a9488a916f1d65db5bf017db6c` |
| Public config | PASS, environment `production`, `demoMode` false |
| Customer smoke | PASS, `prod.customer.sender` |
| CORS isolation | PASS |
| Bootstrap | OFF |
| Demo seed | OFF |
| Production database | `simple_bank_prod`, isolated |

`scripts/staging-smoke.mjs` passed inside the promotion workflow with `EXPECTED_ENVIRONMENT=production` and `REQUIRE_ADMIN=false`. Customer login, `/api/me`, `/api/dashboard`, and `/api/me/accounts` returned 200. The account list contained one valid 12-digit number. Customer `/api/admin/whoami` returned 403.

The production frontend `/`, `/login`, and `/app` return the SPA. The built frontend calls `https://simple-bank-api-production.onrender.com/api`. It does not call the staging API. `localhost` strings in the main bundle come from the URL parser, not from the API base URL.

CORS allows exactly `https://simple-bank-production.vercel.app`. It does not allow `https://simple-bank-staging.vercel.app`, `https://evil.example`, or a wildcard.

Render runs `SPRING_PROFILES_ACTIVE=production` and `MONGODB_DATABASE=simple_bank_prod`. `DEMO_SEED_ENABLED` and `DEMO_SEED_RESET` are false. `BOOTSTRAP_ADMIN_ENABLED` is false and the bootstrap username is absent. The production JWT secret is different from the staging JWT secret. The Atlas user `simple-bank-production-user` has `readWrite` on `simple_bank_prod` only and is scoped to cluster `Bank-Project`.
