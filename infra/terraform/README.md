# Terraform

This configuration describes a new Simple Bank AWS account. It does not manage the current QuickLabs CloudFront distribution.

Apply it only from a normal AWS account, with GitHub OIDC (`AWS_ROLE_ARN`) or an administrator's own credentials. Continuous integration runs `terraform fmt` and `terraform validate`. It does not run `terraform apply`.

## Layout

`infra/terraform` is the reusable module: private S3, CloudFront with origin access control, `/api/*` forwarded to EC2 port 8080, and a security group that allows 8080 only from the CloudFront origin-facing prefix list. SSH and MongoDB port 27017 are not opened. The EC2 user-data script starts MongoDB 7 as replica set `rs0` on a private Docker network and a persistent volume.

`environments/staging` and `environments/production` are the roots you init and apply. Copy `terraform.tfvars.example` to `terraform.tfvars` on the operator machine. That file is gitignored. Do not put passwords, tokens, or connection strings in it.

## Checks

```bash
terraform fmt -check -recursive
terraform -chdir=infra/terraform/environments/production init -backend=false
terraform -chdir=infra/terraform/environments/production validate
```

Repeat the init and validate commands for `environments/staging`.
