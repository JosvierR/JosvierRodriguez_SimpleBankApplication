# Jenkins

`Jenkinsfile` repeats the CI stages: checkout, environment, backend tests, frontend install, lint, test, and build, Docker build, Terraform format and validate, Playwright list, secret scan, and artifact archive.

Deploy stages are off unless the build sets `DEPLOY_STAGING` or `DEPLOY_PRODUCTION`. Production also stops for a manual approval. The pipeline never force-pushes.

Bind these Jenkins credential IDs. Do not paste the secret values into the Jenkinsfile.

| Credential ID | Use |
| --- | --- |
| `RENDER_STAGING_DEPLOY_HOOK_URL` | Staging deploy hook |
| `RENDER_PRODUCTION_DEPLOY_HOOK_URL` | Production deploy hook |
| `E2E_ADMIN_USERNAME` | Staging admin login |
| `E2E_ADMIN_PASSWORD` | Staging admin password |
| `E2E_CUSTOMER_USERNAME` | Customer login |
| `E2E_CUSTOMER_PASSWORD` | Customer password |

GitHub Actions remains the path that updates `staging` and `deploy/vercel-production`.
