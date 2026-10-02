# AWS deployment

The QuickLabs course site is already live at https://d1sh3vurxc4laf.cloudfront.net. This repository does not apply Terraform to that account. A normal AWS account uses remote state and Systems Manager, described in `docs/terraform.md`.

| Path | What it does |
| --- | --- |
| QuickLabs console | Existing CloudFront, private S3, and EC2. Leave it in place. |
| `01-ec2-user-data.sh` | Normal bootstrap for a new instance. MongoDB 7, replica set `rs0`, keyfile, no public 27017. |
| `06-repair-current-ec2.sh` | Recovery utility for the current QuickLabs host. Not the normal deploy path. |
| `infra/aws/deploy-release.sh` | Exact-SHA update through Systems Manager. It keeps the Mongo volume and generated secrets. |

| Item | Value |
| --- | --- |
| Live QuickLabs URL | https://d1sh3vurxc4laf.cloudfront.net |
| AWS account | 279249498881 |
| Region | us-east-1 |
| Database name | simple_bank_aws |
| Database user | simplebank_app, readWrite on simple_bank_aws only |

Existing Vercel and Render production remains separate:

- https://simple-bank-production.vercel.app
- https://simple-bank-api-production.onrender.com/api

MongoDB is not given a public port. Port 27017 and the metrics port 9091 must not be added to the security group.
