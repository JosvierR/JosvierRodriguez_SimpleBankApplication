# AWS console verification

Run these checks after CloudFront shows **Deployed**. Do not put passwords, tokens, or the identity file in a screenshot.

Replace `DISTRIBUTION_DOMAIN` with the CloudFront domain.

## Health, readiness, and config

```text
https://DISTRIBUTION_DOMAIN/api/public/health
https://DISTRIBUTION_DOMAIN/api/public/ready
https://DISTRIBUTION_DOMAIN/api/public/config
```

Health status is `UP`. Ready status is `UP`, environment is `production`, and revision is `dafc89b4b804cddaa2f443a55b05d48ffa3bd921`. Config has `demoMode` false. None of the three responses contains a database name, URI, or secret.

## Frontend and direct refresh

Load `/`, `/login`, and `/app` on the CloudFront origin. Refresh `/app` from the address bar. The SPA function serves `index.html` for that extensionless route.

In the browser developer tools, **Network** must show API calls to `https://DISTRIBUTION_DOMAIN/api/...`. There must be no request to `localhost`, `simple-bank-api-staging.onrender.com`, or `simple-bank-api-production.onrender.com`.

## Login

The generated passwords are only in `/opt/simple-bank/aws-identities.json` on the instance, mode `600`.

1. Add a temporary security-group inbound rule: TCP `22`, source **My IP**.
2. EC2, **Connect**, **EC2 Instance Connect**.
3. Read the identity file in that terminal and type the password into the CloudFront login form.
4. Disconnect.
5. Delete the TCP `22` rule before taking screenshots.

Sign in as `aws.customer.sender`. The dashboard loads. Open the customer's accounts. One checking account shows `100.00` unless a later manual transaction changed it.

Sign in as `aws.admin`. The admin area loads. Sign out between the two users.

Do not photograph the Instance Connect window while the identity file is visible.

## Customer and admin API

From the customer session, a call to `/api/admin/whoami` returns `403`. From the admin session, `/api/admin/whoami` returns `200` and the roles include `ADMIN`.

Customer calls to `/api/me`, `/api/dashboard`, and `/api/me/accounts` return `200`.

## Mongo persistence

On the instance, during the same temporary connection:

```bash
sudo docker ps --format '{{.Names}} {{.Ports}}'
sudo docker volume inspect simple-bank-mongo-data --format '{{.Name}}'
```

`simple-bank-mongo` has no host port. `simple-bank-api` publishes `8080` only. Then:

```bash
sudo docker restart simple-bank-api
```

Wait until `https://DISTRIBUTION_DOMAIN/api/public/ready` is `UP` again. Sign in as the customer again. The checking balance is still there, so the Docker volume survived the API restart.

## Security proof

| Check | Required result |
| --- | --- |
| S3 Block Public Access | On for every setting |
| S3 bucket policy principal | `cloudfront.amazonaws.com` only, restricted to this distribution |
| Security group port 27017 | No rule |
| Security group port 8080 | Prefix list `com.amazonaws.global.cloudfront.origin-facing` only |
| Security group port 22 | Absent after troubleshooting |
| Mongo container | No host port mapping |
| Demo seed | `false` in `/opt/simple-bank/backend.env` |
| Admin bootstrap | `BOOTSTRAP_ADMIN_ENABLED=false` and blank username |
| Release | `/api/public/ready` revision `dafc89b4b804cddaa2f443a55b05d48ffa3bd921` |

The QuickLabs console deployment that passed these checks is https://d1sh3vurxc4laf.cloudfront.net. Release hardening does not change that distribution. A future normal-account Terraform deployment is a separate path and stays unapplied until remote state and approval exist.
