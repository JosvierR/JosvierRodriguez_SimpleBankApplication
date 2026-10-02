# Observability

Local Grafana, Loki, Prometheus, and Grafana Alloy are defined in `infra/observability/docker-compose.observability.yml`. Grafana listens on `127.0.0.1:3001` and anonymous access is off. The local admin password comes from `GRAFANA_ADMIN_PASSWORD` and defaults to a laptop-only value. Do not publish this compose file to the public internet.

Spring Boot does not expose Actuator. Adding it would publish a new metrics surface on the API, so Prometheus records the API target as down until a private metrics endpoint exists. Public health remains `GET /api/public/health` and `GET /api/public/ready`. Those responses do not include environment variables.

## Logs

Console lines include a timestamp, level, logger, `env`, and `revision`. Do not log JWTs, passwords, MongoDB URIs, Authorization headers, or credentials.

In Grafana, open the Simple Bank Overview dashboard. The Loki queries are:

```logql
{container=~".+"}
{container=~".+"} |~ "(?i)error|exception"
{container="simple-bank-mongo"}
```

Alloy reads the local Docker socket and pushes those container logs to Loki.
