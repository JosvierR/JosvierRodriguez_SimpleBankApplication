# Terraform state bootstrap

Run this once in a normal AWS account before `terraform apply`. It creates a private, versioned, encrypted S3 bucket and a DynamoDB lock table. Terraform 1.9, the version used in CI, locks the S3 backend with DynamoDB.

```bash
bash infra/terraform/bootstrap-state/bootstrap-state.sh \
  simple-bank-terraform-state \
  us-east-1 \
  simple-bank-terraform-locks
```

GitHub configuration for Deploy AWS:

| Name | Kind | Purpose |
| --- | --- | --- |
| `AWS_ROLE_ARN` | secret | GitHub OIDC role |
| `AWS_TF_STATE_BUCKET` | variable | State bucket from the bootstrap |
| `AWS_TF_STATE_REGION` | variable | Bucket region |
| `AWS_TF_LOCK_TABLE` | variable | DynamoDB lock table |
| `AWS_FRONTEND_BUCKET` | variable | Private frontend bucket name |

State keys are `staging/terraform.tfstate` and `production/terraform.tfstate`. Do not commit `terraform.tfvars`, state files, or credentials.

CI runs `terraform init -backend=false` and `terraform validate` only. Deploy AWS refuses to apply when any remote-state setting is missing, and it prints `AWS_AUTOMATION_UNAVAILABLE`. It does not fall back to local state.
