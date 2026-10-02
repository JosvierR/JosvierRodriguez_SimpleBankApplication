# Playwright

End-to-end tests live in `e2e/` and use the root `package.json`.

| Command | What it runs |
| --- | --- |
| `npm run e2e` | Every spec. Banking mutations skip unless enabled. |
| `npm run e2e:staging` | Everything except `@mutation` |
| `npm run e2e:production` | `@readonly` public and security checks |
| `npm run e2e:aws` | The same read-only set against the CloudFront origin |

Set `E2E_BASE_URL` to the frontend and `E2E_API_BASE_URL` to the API, including the `/api` suffix. Credentials come from `E2E_ADMIN_USERNAME`, `E2E_ADMIN_PASSWORD`, `E2E_CUSTOMER_USERNAME`, and `E2E_CUSTOMER_PASSWORD`. The repository does not contain those passwords.

`E2E_ALLOW_MUTATION=true` plus `E2E_MUTATION_ACCOUNT_ID` is required before `npm run e2e:mutation` deposits and withdraws `0.01` on that one account, then checks the balance returned to the start. Staging and production release workflows do not set that flag. The manual workflow is Mutation E2E. Production runs `npm run e2e:production`, which selects `@readonly` only.

Failures save a screenshot. A retried test saves a trace. The HTML report is `playwright-report/`.
