#!/usr/bin/env bash
# Separate S3-trigger practice function. It is not connected to Simple Bank.
set -euo pipefail

export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_PAGER=""

ACCOUNT_ID="279249498881"
BUCKET="student-josvier-rodriguez-uploads"
FUNCTION_NAME="student-s3-logger"
ROLE_ARN="arn:aws:iam::279249498881:role/quicklabs-fullstack-aws-28sep-batch-a-lambda-exec"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

echo "Lab 01 uses the QuickLabs batch Lambda role and does not call the bank API."

if ! aws iam get-role --role-name quicklabs-fullstack-aws-28sep-batch-a-lambda-exec >/dev/null 2>&1; then
  echo "IAM GetRole is denied or the batch Lambda role is not visible. The role will not be modified."
fi

if ! aws s3api head-bucket --bucket "$BUCKET" >/dev/null 2>&1; then
  aws s3api create-bucket --bucket "$BUCKET" --region us-east-1 >/dev/null
fi
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null

cat > "$WORK/lambda_function.py" <<'PY'
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def lambda_handler(event, context):
    for record in event.get("Records", []):
        bucket = record.get("s3", {}).get("bucket", {}).get("name")
        key = record.get("s3", {}).get("object", {}).get("key")
        logger.info("S3 object created bucket=%s key=%s", bucket, key)
    return {"statusCode": 200}
PY
python3 - "$WORK" <<'PY'
import pathlib, sys, zipfile
work = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(work / "function.zip", "w", zipfile.ZIP_DEFLATED) as archive:
    archive.write(work / "lambda_function.py", "lambda_function.py")
PY

if aws lambda get-function --function-name "$FUNCTION_NAME" >/dev/null 2>&1; then
  aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$WORK/function.zip" >/dev/null
else
  aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime python3.12 \
    --role "$ROLE_ARN" \
    --handler lambda_function.lambda_handler \
    --timeout 10 \
    --memory-size 128 \
    --zip-file "fileb://$WORK/function.zip" >/dev/null
fi

aws lambda wait function-active --function-name "$FUNCTION_NAME"
FUNCTION_ARN="$(aws lambda get-function --function-name "$FUNCTION_NAME" --query Configuration.FunctionArn --output text)"

aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id s3-object-created \
  --action lambda:InvokeFunction \
  --principal s3.amazonaws.com \
  --source-arn "arn:aws:s3:::$BUCKET" \
  --source-account "$ACCOUNT_ID" >/dev/null 2>&1 || true

aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET" \
  --notification-configuration "{\"LambdaFunctionConfigurations\":[{\"Id\":\"object-created-put\",\"LambdaFunctionArn\":\"$FUNCTION_ARN\",\"Events\":[\"s3:ObjectCreated:Put\"]}]}"

printf 'Simple Bank AWS lab 01\n' > "$WORK/aws-lab-test.txt"
aws s3 cp "$WORK/aws-lab-test.txt" "s3://$BUCKET/aws-lab-test.txt" >/dev/null

START_MS="$(( ($(date +%s) - 120) * 1000 ))"
FOUND=""
for _ in $(seq 1 18); do
  sleep 10
  FOUND="$(aws logs filter-log-events \
    --log-group-name "/aws/lambda/$FUNCTION_NAME" \
    --start-time "$START_MS" \
    --filter-pattern "aws-lab-test.txt" \
    --query "events[].message" \
    --output text 2>/dev/null || true)"
  if printf '%s' "$FOUND" | grep -q "aws-lab-test.txt"; then
    echo "LAB01_PASS bucket=$BUCKET function=$FUNCTION_NAME"
    exit 0
  fi
done

echo "Lab 01 upload did not produce the expected CloudWatch log." >&2
exit 1
