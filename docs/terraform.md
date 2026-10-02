# Terraform

See `infra/terraform/README.md` for the module layout and the commands CI runs.

The production and staging roots create a private S3 bucket, a CloudFront distribution with origin access control, and an EC2 host. Port 8080 accepts traffic only from the CloudFront origin-facing prefix list. Port 27017, port 9091, and SSH are closed. MongoDB 7 runs as the single-node replica set `rs0` with a keyfile, on a private Docker network and a persistent volume.

Changing `application_revision` does not replace the instance and does not redeploy the API. After apply, Deploy AWS runs `infra/aws/deploy-release.sh` on the instance through Systems Manager. That script checks out the exact SHA, keeps the Mongo volume and the generated secrets, and restarts only the API container.

Remote state is required before apply. See `infra/terraform/bootstrap-state/README.md`. CI validates with `terraform init -backend=false` and never applies. Deploy AWS prints `AWS_AUTOMATION_UNAVAILABLE` and stops when `AWS_ROLE_ARN`, the state bucket, the state region, or the lock table is missing.

Copy `terraform.tfvars.example` to a local `terraform.tfvars`. The example contains a bucket name and a revision placeholder, not credentials.

Do not apply this configuration to the QuickLabs account. The live distribution at `https://d1sh3vurxc4laf.cloudfront.net` stays as it is.
