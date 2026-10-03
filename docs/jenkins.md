# Jenkins

GitHub Actions is the release path. Jenkins is a secondary CI pipeline for a demo controller.

`Jenkinsfile` runs checkout, backend tests, frontend install, lint, test, and build, Docker image builds, Terraform format and validate for staging and production, the local Grafana Loki Prometheus Alloy compose file, a Playwright listing, the repository secret scan, and artifact archive.

It does not deploy Render, Vercel, or AWS, and it does not move `staging` or `deploy/vercel-production`. Those steps stay in `.github/workflows/deploy-staging.yml` and `.github/workflows/promote-production.yml`.
