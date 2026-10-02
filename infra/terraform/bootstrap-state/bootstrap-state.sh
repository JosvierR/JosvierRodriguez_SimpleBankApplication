#!/bin/bash
# Create the remote Terraform state bucket and lock table once.
# Pass the bucket name, region, and lock table as arguments. No account keys belong in this file.
set -euo pipefail
bucket="${1:-}"
region="${2:-}"
table="${3:-}"
if [ -z "$bucket" ] || [ -z "$region" ] || [ -z "$table" ]; then
  echo "usage: bootstrap-state.sh <bucket> <region> <lock-table>"
  exit 1
fi
if aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
  echo "state bucket already exists"
else
  if [ "$region" = "us-east-1" ]; then
    aws s3api create-bucket --bucket "$bucket" --region "$region"
  else
    aws s3api create-bucket --bucket "$bucket" --region "$region" --create-bucket-configuration "LocationConstraint=${region}"
  fi
fi
aws s3api put-public-access-block --bucket "$bucket" --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
aws s3api put-bucket-versioning --bucket "$bucket" --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$bucket" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
if aws dynamodb describe-table --table-name "$table" --region "$region" >/dev/null 2>&1; then
  echo "lock table already exists"
else
  aws dynamodb create-table --table-name "$table" --region "$region" --billing-mode PAY_PER_REQUEST --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH
fi
echo "Terraform state infrastructure is ready"
