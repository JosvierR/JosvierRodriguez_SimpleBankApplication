# Final review checklist

- [ ] Canonical, staging, and production point at the same SHA
- [ ] Required CI is green for that SHA
- [ ] Staging `/api/public/ready` is UP, environment staging, revision that SHA
- [ ] Staging frontend returns HTTP 200
- [ ] Production `/api/public/health` is UP
- [ ] Production `/api/public/ready` is UP, environment production, revision that SHA
- [ ] Production `/api/public/config` has demoMode false
- [ ] Production frontend returns HTTP 200
- [ ] `production/deploy` commit status is success
- [ ] Production Playwright read-only run passed
- [ ] No force-push was used
- [ ] No secrets are in the commit
- [ ] QuickLabs https://d1sh3vurxc4laf.cloudfront.net was not changed by CI
- [ ] Terraform validate passed and remote state is required before apply
- [ ] Gitleaks and the repository secret scan passed
- [ ] Grafana overview, Loki, and the Prometheus API target were checked locally
- [ ] Jenkinsfile is secondary CI and does not deploy production
