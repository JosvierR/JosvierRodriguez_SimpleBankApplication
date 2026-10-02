# DevOps platform

GitHub Actions is the release path. Jenkins can repeat the same checks. Terraform describes a new AWS account and does not change the current QuickLabs distribution.

```text
GitHub
  ↓
CI
  ├ Backend tests
  ├ Frontend tests
  ├ Docker
  ├ Terraform validation
  └ Playwright
  ↓
Staging
  ├ Render
  ├ Vercel
  └ E2E
  ↓ approval
Production
  ├ Render
  ├ Vercel
  └ smoke/E2E
```

AWS path, for a normal account with GitHub OIDC:

```text
Terraform
  ↓
S3 + CloudFront + EC2
  ↓
Spring Boot + Mongo rs0
```

Observability path:

```text
application/container logs
  ↓
Loki
  ↓
Grafana

metrics
  ↓
Prometheus
  ↓
Grafana
```

## Live environments

| Environment | Frontend | API |
| --- | --- | --- |
| Production | https://simple-bank-production.vercel.app | https://simple-bank-api-production.onrender.com/api |
| Staging | https://simple-bank-staging.vercel.app | https://simple-bank-api-staging.onrender.com/api |
| AWS | https://d1sh3vurxc4laf.cloudfront.net | same origin `/api` |

The AWS URL is the existing QuickLabs deployment. Automation is prepared and is not applied to that account from CI.

## Promotion

1. Work on `devops/platform-automation` until Required CI is green.
2. Fast-forward `ReactFrontend-BankApp-Making-RestCall-To-Backend`.
3. Fast-forward `staging` to that exact SHA.
4. Wait for Render, Vercel, Playwright, and the `staging/deploy` success status.
5. Promote that same SHA with the Promote Production workflow. The workflow deploys Render and Vercel, runs smoke tests and read-only Playwright, and only then fast-forwards `deploy/vercel-production`. Do not force-push.

## Secrets

GitHub environment secrets hold the Vercel token, Vercel organization and project ids, Render deploy hooks, and end-to-end passwords. AWS uses `AWS_ROLE_ARN` plus the remote-state variables in `docs/terraform.md`. None of those values belong in the repository. If the AWS role or remote state settings are missing, Deploy AWS stops with `AWS_AUTOMATION_UNAVAILABLE`.

The QuickLabs site at https://d1sh3vurxc4laf.cloudfront.net is a separate course deployment. Terraform in this repository is not applied to it.
