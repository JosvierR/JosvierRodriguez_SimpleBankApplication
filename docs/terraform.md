# Terraform

See `infra/terraform/README.md` for the module layout and the commands CI runs.

The production and staging roots create a private S3 bucket, a CloudFront distribution with origin access control, and an EC2 host. Port 8080 accepts traffic only from the CloudFront origin-facing prefix list. Port 27017 and SSH are closed. MongoDB 7 runs as the single-node replica set `rs0` on a Docker network and a persistent volume.

Copy `terraform.tfvars.example` to a local `terraform.tfvars`. The example contains a bucket name and a revision placeholder, not credentials.

Do not apply this configuration to the QuickLabs account. That account is temporary, and the live distribution at `https://d1sh3vurxc4laf.cloudfront.net` must stay as it is.

Preferred authentication is GitHub OIDC through `AWS_ROLE_ARN`. Static access keys are a fallback only, and they stay in the operator's secret store.
