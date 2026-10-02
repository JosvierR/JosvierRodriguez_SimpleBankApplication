# Observability

Local Grafana, Loki, Prometheus, and Grafana Alloy are defined in `infra/observability/docker-compose.observability.yml`. Grafana listens on `127.0.0.1:3001` and anonymous access is off. The local admin password comes from `GRAFANA_ADMIN_PASSWORD` and defaults to a laptop-only value. Do not publish this compose file to the public internet.

Spring Boot exposes health and Prometheus metrics on management port 9091 only. The public API on 8080 does not serve `/actuator`. Environment, config properties, beans, and heap dumps are disabled. Local Compose publishes `127.0.0.1:9091`. AWS does not open 9091 in the security group and CloudFront has no behavior for it.

Prometheus scrapes `host.docker.internal:9091`. Alloy relabels Docker's container name onto the Loki label `container`.

## Logs

Console lines include a timestamp, level, logger, `env`, and `revision`. Do not log JWTs, passwords, MongoDB URIs, Authorization headers, or credentials.

In Grafana, open the Simple Bank Overview dashboard. The Loki queries are:

```logql
{container=~".+"}
{container=~".+"} |~ "(?i)error|exception"
{container="simple-bank-mongo"}
```

Alloy reads the local Docker socket and pushes those container logs to Loki. Grafana, Loki, and Prometheus use named volumes.

A local run of this stack confirmed the Prometheus target `simple-bank-api` is UP, Loki returns logs for `{container="simple-bank-api"}` and `{container="simple-bank-mongo"}`, and Grafana loads both datasources and the Simple Bank Overview dashboard. That check is local. It is not a public production Grafana deployment.
