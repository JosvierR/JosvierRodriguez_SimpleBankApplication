# Production acceptance

This page records the production release that staging, canonical, and production shared before the cross-environment spike evidence. It does not contain passwords, tokens, database URIs, or JWT secrets.

## Baseline release

| Item | Value |
| --- | --- |
| Date | 2026-10-02 |
| BASELINE_RELEASE_SHA | `b6791524a61c4590e80a9a87ea42e6ee9c782c37` |
| Promotion workflow | https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/36960935729 SUCCESS |
| Approval | completed by the production environment reviewer |
| Render URL | https://simple-bank-api-production.onrender.com |
| Render service | `srv-davgjgad0e5s73ftrgpg` |
| Render deploy ID | `dep-davirgu7bikc73e81pm0` |
| Render deploy trigger | `api` |
| Vercel URL | https://simple-bank-production.vercel.app |
| Vercel project | `prj_WrGbS4OOJBKAyuryDfoXj54TgSLx` |
| Vercel deployment ID | `dpl_7MnmrCcS5V8xwCaLytLxX6L4cBL8` |
| Health | PASS |
| Ready | PASS, status `UP`, environment `production` |
| Revision | PASS, `b6791524a61c4590e80a9a87ea42e6ee9c782c37` |
| Public config | PASS, `demoMode` false |
| Customer smoke | PASS, `prod.customer.sender` |
| CORS isolation | PASS |
| Bootstrap | OFF |
| Demo seed | OFF |
| Production database | `simple_bank_prod`, isolated |

The first attempt of that promotion fast-forwarded `deploy/vercel-production` and then waited 15 minutes. Render stayed on `1e8323d1f83458a9488a916f1d65db5bf017db6c`. The stored production deploy hook returned HTTP 200 and did not create a deploy. The live deploy `dep-davirgu7bikc73e81pm0` was created through the Render API for the same SHA. The rerun then found that revision, deployed Vercel, and passed smoke. This page does not claim that the hook created that deploy.

## Replacement hook

`RENDER_PRODUCTION_DEPLOY_HOOK_URL` was replaced in the production environment at 2026-10-02T13:21:39Z. Its value is not recorded here. That replacement is not yet proven. The next production promotion must create a new Render deploy, with trigger `api`, for the promoted SHA. An already-running revision is not evidence that the hook works.
