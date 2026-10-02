#!/usr/bin/env bash
# CloudShell entry point for the additional AWS course deployment.
# It does not change the Vercel or Render production environment.
set -euo pipefail

export AWS_DEFAULT_REGION=us-east-1
export AWS_REGION=us-east-1
export AWS_PAGER=""

APP_SHA="dafc89b4b804cddaa2f443a55b05d48ffa3bd921"
EXPECTED_ACCOUNT="279249498881"
PREFIX="josvier-simple-bank"
ECR_NAME="${PREFIX}-api"
SERVICE_NAME="${PREFIX}-api"
WEB_BUCKET="${PREFIX}-web-${EXPECTED_ACCOUNT}"
BUILD_BUCKET="${PREFIX}-build-${EXPECTED_ACCOUNT}"
SSM_PREFIX="/josvier/simple-bank/aws"
MONGO_PARAM="${SSM_PREFIX}/mongodb-uri"
JWT_PARAM="${SSM_PREFIX}/jwt-secret"
IMAGE_TAG="dafc89b4"
CF_COMMENT="Josvier Simple Bank AWS Submission"
CACHE_POLICY_ORIGIN="83da9c7e-98b4-4e11-a168-04f0df8e2c65"
CACHE_POLICY_DISABLED="4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
ACCESS_ROLE="${PREFIX}-apprunner-ecr-access"
INSTANCE_ROLE="${PREFIX}-apprunner-instance"
CODEBUILD_ROLE="${PREFIX}-codebuild"
CODEBUILD_PROJECT="${PREFIX}-image"
IDENTITY_FILE="${HOME}/.simple-bank-aws-identities.json"
STATE_FILE="${HOME}/.simple-bank-aws-state.env"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"
umask 077

die() {
  echo "$1" >&2
  exit 1
}

require_tools() {
  command -v aws >/dev/null 2>&1 || die "AWS CLI is not available in this shell."
  command -v git >/dev/null 2>&1 || die "git is required."
  command -v python3 >/dev/null 2>&1 || die "python3 is required."
  command -v curl >/dev/null 2>&1 || die "curl is required."
}

verify_source() {
  git cat-file -e "${APP_SHA}^{commit}" || die "The verified release SHA is not in this clone."
  git merge-base --is-ancestor "$APP_SHA" HEAD || die "HEAD does not contain the verified release SHA."
  git diff --quiet "$APP_SHA" -- Dockerfile pom.xml mvnw .mvn src frontend \
    || die "Application files differ from ${APP_SHA}. Refusing to deploy a different application."
  echo "Application files match ${APP_SHA}."
}

verify_account() {
  ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
  [ "$ACCOUNT" = "$EXPECTED_ACCOUNT" ] || die "Unexpected AWS account. Expected ${EXPECTED_ACCOUNT}."
  echo "AWS account ${ACCOUNT}, region ${AWS_REGION}."
}

probe() {
  local name="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    echo "PERMITTED ${name}"
  else
    echo "DENIED ${name}"
  fi
}

probe_permissions() {
  echo "Permission probe:"
  probe s3 aws s3api list-buckets
  probe ecr aws ecr describe-repositories --max-results 1
  probe apprunner aws apprunner list-services --max-results 1
  probe cloudfront aws cloudfront list-distributions --max-items 1
  probe ssm aws ssm describe-parameters --max-results 5
  probe iam-get-role aws iam get-role --role-name quicklabs-fullstack-aws-28sep-batch-a-lambda-exec
}

ensure_ecr() {
  if ! aws ecr describe-repositories --repository-names "$ECR_NAME" >/dev/null 2>&1; then
    aws ecr create-repository \
      --repository-name "$ECR_NAME" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256 >/dev/null
  fi
  ECR_URI="${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com/${ECR_NAME}"
  echo "ECR repository ${ECR_URI}"
}

image_exists() {
  aws ecr describe-images \
    --repository-name "$ECR_NAME" \
    --image-ids "imageTag=${IMAGE_TAG}" >/dev/null 2>&1
}

docker_push() {
  aws ecr get-login-password --region us-east-1 \
    | docker login --username AWS --password-stdin "${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com" >/dev/null
  docker build -t "${ECR_NAME}:${IMAGE_TAG}" .
  docker tag "${ECR_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
  docker tag "${ECR_NAME}:${IMAGE_TAG}" "${ECR_URI}:submission-final"
  docker push "${ECR_URI}:${IMAGE_TAG}" >/dev/null
  docker push "${ECR_URI}:submission-final" >/dev/null
}

codebuild_push() {
  if ! aws iam get-role --role-name "$CODEBUILD_ROLE" >/dev/null 2>&1; then
    aws iam create-role \
      --role-name "$CODEBUILD_ROLE" \
      --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"codebuild.amazonaws.com"},"Action":"sts:AssumeRole"}]}' >/dev/null \
      || die "Docker is unavailable and this account does not permit a CodeBuild role."
  fi
  cat > "${HOME}/.simple-bank-codebuild-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
      "Resource": "arn:aws:logs:us-east-1:${ACCOUNT}:log-group:/aws/codebuild/${CODEBUILD_PROJECT}:*"
    },
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject", "s3:GetObjectVersion", "s3:PutObject"],
      "Resource": "arn:aws:s3:::${BUILD_BUCKET}/*"
    },
    {
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:CompleteLayerUpload",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:UploadLayerPart",
        "ecr:BatchGetImage"
      ],
      "Resource": "arn:aws:ecr:us-east-1:${ACCOUNT}:repository/${ECR_NAME}"
    }
  ]
}
EOF
  aws iam put-role-policy \
    --role-name "$CODEBUILD_ROLE" \
    --policy-name "${CODEBUILD_ROLE}-policy" \
    --policy-document "file://${HOME}/.simple-bank-codebuild-policy.json" >/dev/null
  rm -f "${HOME}/.simple-bank-codebuild-policy.json"
  if ! aws s3api head-bucket --bucket "$BUILD_BUCKET" >/dev/null 2>&1; then
    aws s3api create-bucket --bucket "$BUILD_BUCKET" --region us-east-1 >/dev/null
  fi
  aws s3api put-public-access-block \
    --bucket "$BUILD_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null
  local work
  work="$(mktemp -d)"
  git archive --format=zip --output "$work/source.zip" "$APP_SHA" Dockerfile pom.xml mvnw .mvn src
  cat > "$work/buildspec.yml" <<'YAML'
version: 0.2
phases:
  pre_build:
    commands:
      - aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin "$ECR_REGISTRY"
  build:
    commands:
      - docker build -t "$ECR_IMAGE" .
      - docker tag "$ECR_IMAGE" "$ECR_IMAGE_FINAL"
      - docker push "$ECR_IMAGE"
      - docker push "$ECR_IMAGE_FINAL"
YAML
  python3 - "$work" <<'PY'
import pathlib, sys, zipfile
work = pathlib.Path(sys.argv[1])
with zipfile.ZipFile(work / "source.zip", "a") as archive:
    archive.write(work / "buildspec.yml", "buildspec.yml")
PY
  aws s3 cp "$work/source.zip" "s3://${BUILD_BUCKET}/simple-bank-source.zip" >/dev/null
  rm -rf "$work"
  local role_arn="arn:aws:iam::${ACCOUNT}:role/${CODEBUILD_ROLE}"
  local project_json="${HOME}/.simple-bank-codebuild-project.json"
  cat > "$project_json" <<EOF
{
  "name": "${CODEBUILD_PROJECT}",
  "source": { "type": "S3", "location": "${BUILD_BUCKET}/simple-bank-source.zip" },
  "artifacts": { "type": "NO_ARTIFACTS" },
  "environment": {
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/amazonlinux-x86_64-standard:5.0",
    "computeType": "BUILD_GENERAL1_MEDIUM",
    "privilegedMode": true,
    "environmentVariables": [
      { "name": "ECR_REGISTRY", "value": "${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com" },
      { "name": "ECR_IMAGE", "value": "${ECR_URI}:${IMAGE_TAG}" },
      { "name": "ECR_IMAGE_FINAL", "value": "${ECR_URI}:submission-final" }
    ]
  },
  "serviceRole": "${role_arn}",
  "timeoutInMinutes": 40
}
EOF
  if ! aws codebuild batch-get-projects --names "$CODEBUILD_PROJECT" --query "projects[0].name" --output text 2>/dev/null | grep -qx "$CODEBUILD_PROJECT"; then
    aws codebuild create-project --cli-input-json "file://${project_json}" >/dev/null \
      || die "Docker is unavailable and CodeBuild project creation was denied."
  fi
  rm -f "$project_json"
  local build_id
  build_id="$(aws codebuild start-build --project-name "$CODEBUILD_PROJECT" --query build.id --output text)"
  echo "CodeBuild ${build_id}"
  local status=""
  for _ in $(seq 1 80); do
    sleep 30
    status="$(aws codebuild batch-get-builds --ids "$build_id" --query "builds[0].buildStatus" --output text)"
    echo "CodeBuild status=${status}"
    if [ "$status" = "SUCCEEDED" ]; then
      return 0
    fi
    case "$status" in
      FAILED|FAULT|STOPPED|TIMED_OUT) die "CodeBuild did not push the image." ;;
    esac
  done
  die "CodeBuild did not finish."
}

ensure_image() {
  if image_exists; then
    echo "ECR image ${ECR_URI}:${IMAGE_TAG} already exists."
    return 0
  fi
  if docker info >/dev/null 2>&1; then
    docker_push
  else
    echo "Docker is not available. Building through CodeBuild."
    codebuild_push
  fi
  image_exists || die "The immutable image tag ${IMAGE_TAG} was not pushed."
}

ensure_web_bucket() {
  if ! aws s3api head-bucket --bucket "$WEB_BUCKET" >/dev/null 2>&1; then
    aws s3api create-bucket --bucket "$WEB_BUCKET" --region us-east-1 >/dev/null
  fi
  aws s3api put-public-access-block \
    --bucket "$WEB_BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true >/dev/null
  aws s3api put-bucket-ownership-controls \
    --bucket "$WEB_BUCKET" \
    --ownership-controls 'Rules=[{ObjectOwnership=BucketOwnerEnforced}]' >/dev/null
  echo "S3 bucket ${WEB_BUCKET} remains private."
}

ensure_oac() {
  OAC_ID="$(aws cloudfront list-origin-access-controls \
    --query "OriginAccessControlList.Items[?Name=='${PREFIX}-oac'].Id | [0]" \
    --output text)"
  if [ -z "$OAC_ID" ] || [ "$OAC_ID" = "None" ]; then
    OAC_ID="$(aws cloudfront create-origin-access-control \
      --origin-access-control-config "Name=${PREFIX}-oac,Description=${CF_COMMENT},SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
      --query OriginAccessControl.Id --output text)"
  fi
}

create_distribution() {
  local policy="$1"
  local config
  config="$(mktemp)"
  cat > "$config" <<EOF
{
  "CallerReference": "${PREFIX}-${policy}-$(date +%s)",
  "Comment": "${CF_COMMENT}",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "${PREFIX}-s3",
        "DomainName": "${WEB_BUCKET}.s3.us-east-1.amazonaws.com",
        "OriginAccessControlId": "${OAC_ID}",
        "S3OriginConfig": { "OriginAccessIdentity": "" }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "${PREFIX}-s3",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET", "HEAD"] }
    },
    "Compress": true,
    "CachePolicyId": "${policy}"
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      { "ErrorCode": 403, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 },
      { "ErrorCode": 404, "ResponsePagePath": "/index.html", "ResponseCode": "200", "ErrorCachingMinTTL": 0 }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": { "CloudFrontDefaultCertificate": true },
  "HttpVersion": "http2",
  "Restrictions": { "GeoRestriction": { "RestrictionType": "none", "Quantity": 0 } }
}
EOF
  if aws cloudfront create-distribution --distribution-config "file://${config}" > "${HOME}/.simple-bank-cf-create.json"; then
    rm -f "$config"
    return 0
  fi
  rm -f "$config"
  return 1
}

ensure_cloudfront() {
  ensure_oac
  local existing
  existing="$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='${CF_COMMENT}'].[Id,DomainName] | [0]" \
    --output text 2>/dev/null || true)"
  if [ -n "$existing" ] && [ "$existing" != "None" ]; then
    CF_ID="$(printf '%s' "$existing" | awk '{print $1}')"
    CF_DOMAIN="$(printf '%s' "$existing" | awk '{print $2}')"
  else
    if ! create_distribution "$CACHE_POLICY_ORIGIN"; then
      echo "Origin cache policy was rejected. Retrying with caching disabled."
      create_distribution "$CACHE_POLICY_DISABLED" || die "CloudFront distribution was not created."
    fi
    CF_ID="$(python3 -c 'import json; print(json.load(open("'"${HOME}/.simple-bank-cf-create.json"'"))["Distribution"]["Id"])')"
    CF_DOMAIN="$(python3 -c 'import json; print(json.load(open("'"${HOME}/.simple-bank-cf-create.json"'"))["Distribution"]["DomainName"])')"
    rm -f "${HOME}/.simple-bank-cf-create.json"
  fi
  echo "CloudFront ${CF_ID} ${CF_DOMAIN}"
}

allow_cloudfront_read() {
  local policy
  policy="$(mktemp)"
  cat > "$policy" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${WEB_BUCKET}/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::${ACCOUNT}:distribution/${CF_ID}"
        }
      }
    }
  ]
}
EOF
  aws s3api put-bucket-policy --bucket "$WEB_BUCKET" --policy "file://${policy}" >/dev/null
  rm -f "$policy"
}

parameter_exists() {
  local found
  found="$(aws ssm describe-parameters \
    --parameter-filters "Key=Name,Values=$1" \
    --query "Parameters[0].Name" \
    --output text 2>/dev/null || true)"
  [ "$found" = "$1" ]
}

ensure_secrets() {
  if ! parameter_exists "$MONGO_PARAM"; then
    if [ -z "${SIMPLE_BANK_AWS_MONGODB_URI:-}" ]; then
      die "Set SIMPLE_BANK_AWS_MONGODB_URI in this shell for database simple_bank_aws and user simple-bank-aws-user with readWrite only on that database. Do not paste the URI into chat. This script will not invent Atlas credentials."
    fi
    aws ssm put-parameter \
      --name "$MONGO_PARAM" \
      --type SecureString \
      --value "$SIMPLE_BANK_AWS_MONGODB_URI" >/dev/null
    unset SIMPLE_BANK_AWS_MONGODB_URI
  fi
  if ! parameter_exists "$JWT_PARAM"; then
    local jwt_file
    jwt_file="$(mktemp)"
    python3 - "$jwt_file" <<'PY'
import base64, os, pathlib, sys
destination = pathlib.Path(sys.argv[1])
raw = os.urandom(48)
token = base64.b64encode(raw).decode("ascii")
if len(base64.b64decode(token)) < 32:
    raise SystemExit("JWT material was too short")
destination.write_text(token, encoding="ascii")
PY
    local jwt_value
    jwt_value="$(cat "$jwt_file")"
    aws ssm put-parameter --name "$JWT_PARAM" --type SecureString --value "$jwt_value" >/dev/null
    unset jwt_value
    rm -f "$jwt_file"
  fi
  echo "SSM parameters are stored as SecureString under ${SSM_PREFIX}/"
}

ensure_role() {
  local name="$1"
  local trust="$2"
  if aws iam get-role --role-name "$name" >/dev/null 2>&1; then
    return 0
  fi
  aws iam create-role --role-name "$name" --assume-role-policy-document "$trust" >/dev/null \
    || die "QuickLabs account does not permit the required App Runner IAM role."
}

ensure_apprunner_roles() {
  ensure_role "$ACCESS_ROLE" '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"build.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  local attached
  attached="$(aws iam list-attached-role-policies --role-name "$ACCESS_ROLE" \
    --query "AttachedPolicies[?PolicyName=='AWSAppRunnerServicePolicyForECRAccess'].PolicyName" \
    --output text)"
  if [ "$attached" != "AWSAppRunnerServicePolicyForECRAccess" ]; then
    aws iam attach-role-policy \
      --role-name "$ACCESS_ROLE" \
      --policy-arn arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess >/dev/null \
      || die "QuickLabs account does not permit the required App Runner IAM role."
  fi
  ensure_role "$INSTANCE_ROLE" '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"tasks.apprunner.amazonaws.com"},"Action":"sts:AssumeRole"}]}'
  cat > "${HOME}/.simple-bank-instance-policy.json" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadSimpleBankParameters",
      "Effect": "Allow",
      "Action": ["ssm:GetParameter", "ssm:GetParameters"],
      "Resource": [
        "arn:aws:ssm:us-east-1:${ACCOUNT}:parameter/josvier/simple-bank/aws/mongodb-uri",
        "arn:aws:ssm:us-east-1:${ACCOUNT}:parameter/josvier/simple-bank/aws/jwt-secret"
      ]
    },
    {
      "Sid": "DecryptParameterStore",
      "Effect": "Allow",
      "Action": "kms:Decrypt",
      "Resource": "*",
      "Condition": { "StringEquals": { "kms:ViaService": "ssm.us-east-1.amazonaws.com" } }
    }
  ]
}
EOF
  aws iam put-role-policy \
    --role-name "$INSTANCE_ROLE" \
    --policy-name "${INSTANCE_ROLE}-ssm" \
    --policy-document "file://${HOME}/.simple-bank-instance-policy.json" >/dev/null \
    || die "QuickLabs account does not permit the required App Runner IAM role."
  rm -f "${HOME}/.simple-bank-instance-policy.json"
  ACCESS_ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/${ACCESS_ROLE}"
  INSTANCE_ROLE_ARN="arn:aws:iam::${ACCOUNT}:role/${INSTANCE_ROLE}"
}

service_arn() {
  aws apprunner list-services \
    --query "ServiceSummaryList[?ServiceName=='${SERVICE_NAME}'].ServiceArn | [0]" \
    --output text
}

write_service_json() {
  local destination="$1"
  local bootstrap_enabled="$2"
  local bootstrap_username="$3"
  cat > "$destination" <<EOF
{
  "ServiceName": "${SERVICE_NAME}",
  "SourceConfiguration": {
    "AuthenticationConfiguration": { "AccessRoleArn": "${ACCESS_ROLE_ARN}" },
    "AutoDeploymentsEnabled": false,
    "ImageRepository": {
      "ImageIdentifier": "${ECR_URI}:${IMAGE_TAG}",
      "ImageRepositoryType": "ECR",
      "ImageConfiguration": {
        "Port": "8080",
        "RuntimeEnvironmentVariables": {
          "SPRING_PROFILES_ACTIVE": "production",
          "MONGODB_DATABASE": "simple_bank_aws",
          "JWT_EXPIRATION_MS": "3600000",
          "DEMO_SEED_ENABLED": "false",
          "DEMO_SEED_RESET": "false",
          "BOOTSTRAP_ADMIN_ENABLED": "${bootstrap_enabled}",
          "BOOTSTRAP_ADMIN_USERNAME": "${bootstrap_username}",
          "APP_REVISION": "${APP_SHA}",
          "CORS_ALLOWED_ORIGINS": "https://${CF_DOMAIN}"
        },
        "RuntimeEnvironmentSecrets": {
          "MONGODB_URI": "arn:aws:ssm:us-east-1:${ACCOUNT}:parameter/josvier/simple-bank/aws/mongodb-uri",
          "JWT_SECRET": "arn:aws:ssm:us-east-1:${ACCOUNT}:parameter/josvier/simple-bank/aws/jwt-secret"
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1024",
    "Memory": "2048",
    "InstanceRoleArn": "${INSTANCE_ROLE_ARN}"
  },
  "HealthCheckConfiguration": {
    "Protocol": "HTTP",
    "Path": "/api/public/health",
    "Interval": 20,
    "Timeout": 5,
    "HealthyThreshold": 1,
    "UnhealthyThreshold": 20
  }
}
EOF
}

wait_running() {
  local status=""
  for _ in $(seq 1 60); do
    status="$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query Service.Status --output text)"
    echo "App Runner status=${status}"
    if [ "$status" = "RUNNING" ]; then
      BACKEND_HOST="$(aws apprunner describe-service --service-arn "$SERVICE_ARN" --query Service.ServiceUrl --output text)"
      BACKEND_URL="https://${BACKEND_HOST}"
      return 0
    fi
    case "$status" in
      CREATE_FAILED|UPDATE_FAILED|DELETE_FAILED) die "App Runner entered ${status}." ;;
    esac
    sleep 20
  done
  die "App Runner did not become RUNNING."
}

apply_service() {
  local bootstrap_enabled="$1"
  local bootstrap_username="$2"
  local spec
  spec="$(mktemp)"
  write_service_json "$spec" "$bootstrap_enabled" "$bootstrap_username"
  SERVICE_ARN="$(service_arn)"
  if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "None" ]; then
    aws apprunner create-service --cli-input-json "file://${spec}" >/dev/null \
      || die "QuickLabs account does not permit the required App Runner IAM role."
    SERVICE_ARN="$(service_arn)"
  else
    python3 - "$spec" <<'PY'
import json, pathlib, sys
path = pathlib.Path(sys.argv[1])
document = json.loads(path.read_text(encoding="utf-8"))
document.pop("ServiceName", None)
path.write_text(json.dumps(document), encoding="utf-8")
PY
    aws apprunner update-service --service-arn "$SERVICE_ARN" --cli-input-json "file://${spec}" >/dev/null
  fi
  rm -f "$spec"
  wait_running
}

verify_backend() {
  local ready config
  curl --silent --show-error --fail "${BACKEND_URL}/api/public/health" | grep -q '"status":"UP"'
  ready="$(curl --silent --show-error --fail "${BACKEND_URL}/api/public/ready")"
  printf '%s' "$ready" | grep -q '"status":"UP"'
  printf '%s' "$ready" | grep -q '"environment":"production"'
  printf '%s' "$ready" | grep -Fq "\"revision\":\"${APP_SHA}\""
  config="$(curl --silent --show-error --fail "${BACKEND_URL}/api/public/config")"
  printf '%s' "$config" | grep -q '"demoMode":false'
  echo "Backend health and readiness passed."
}

install_node() {
  if node -v 2>/dev/null | grep -q '^v24\.'; then
    return 0
  fi
  local node_home="${HOME}/.simple-bank-node"
  if [ ! -x "${node_home}/bin/node" ]; then
    curl --silent --show-error --fail --location \
      "https://nodejs.org/dist/v24.19.0/node-v24.19.0-linux-x64.tar.xz" \
      | tar -xJ -C "${HOME}"
    mv "${HOME}/node-v24.19.0-linux-x64" "$node_home"
  fi
  export PATH="${node_home}/bin:${PATH}"
}

build_frontend() {
  install_node
  export VITE_API_BASE_URL="${BACKEND_URL}/api"
  export VITE_APP_ENV=production
  npm ci --prefix frontend
  npm run build --prefix frontend
  if grep -R -n -E "simple-bank-api-(production|staging)\\.onrender\\.com|https?://localhost" frontend/dist/assets; then
    die "The AWS frontend bundle points at the wrong API."
  fi
  grep -R -q "${BACKEND_HOST}" frontend/dist/assets || die "The AWS frontend bundle does not contain the App Runner host."
}

publish_frontend() {
  aws s3 sync frontend/dist "s3://${WEB_BUCKET}" --delete \
    --exclude "index.html" \
    --exclude "*.map" \
    --exclude ".env*" \
    --cache-control "public,max-age=31536000,immutable" >/dev/null
  aws s3 cp frontend/dist/index.html "s3://${WEB_BUCKET}/index.html" \
    --cache-control "no-cache" \
    --content-type "text/html" >/dev/null
}

wait_cloudfront() {
  aws cloudfront wait distribution-deployed --id "$CF_ID"
  local invalidation
  invalidation="$(aws cloudfront create-invalidation --distribution-id "$CF_ID" --paths "/*" --query Invalidation.Id --output text)"
  aws cloudfront wait invalidation-completed --distribution-id "$CF_ID" --id "$invalidation"
}

cors_header() {
  curl --silent --show-error --dump-header - --output /dev/null \
    --header "Origin: $1" \
    "${BACKEND_URL}/api/public/ready" \
    | awk 'tolower($1)=="access-control-allow-origin:" { print $2 }' \
    | tr -d '\r'
}

verify_edges() {
  local allow deny_prod deny_stage deny_evil
  curl --silent --show-error --fail --output /dev/null "https://${CF_DOMAIN}/"
  curl --silent --show-error --fail --output /dev/null "https://${CF_DOMAIN}/login"
  curl --silent --show-error --fail --output /dev/null "https://${CF_DOMAIN}/app"
  allow="$(cors_header "https://${CF_DOMAIN}")"
  deny_prod="$(cors_header "https://simple-bank-production.vercel.app")"
  deny_stage="$(cors_header "https://simple-bank-staging.vercel.app")"
  deny_evil="$(cors_header "https://evil.example")"
  [ "$allow" = "https://${CF_DOMAIN}" ] || die "CloudFront origin was not allowed."
  [ -z "$deny_prod" ] || die "Production Vercel origin was allowed."
  [ -z "$deny_stage" ] || die "Staging Vercel origin was allowed."
  [ -z "$deny_evil" ] && [ "$deny_evil" != "*" ] || die "A rejected origin was allowed."
  echo "CORS allows only https://${CF_DOMAIN}."
}

provision_users() {
  export AWS_API_BASE="${BACKEND_URL}/api"
  export SIMPLE_BANK_AWS_IDENTITY_FILE="$IDENTITY_FILE"
  set +e
  python3 infra/aws/provision-identities.py prepare
  local prepare_status=$?
  set -e
  if [ "$prepare_status" -eq 10 ]; then
    echo "Promoting aws.admin, then disabling bootstrap."
    apply_service true aws.admin
    verify_backend
    python3 infra/aws/provision-identities.py confirm-admin
    apply_service false ""
    verify_backend
  elif [ "$prepare_status" -ne 0 ]; then
    die "Synthetic identity preparation failed."
  fi
  local bootstrap
  bootstrap="$(aws apprunner describe-service --service-arn "$SERVICE_ARN" \
    --query "Service.SourceConfiguration.ImageRepository.ImageConfiguration.RuntimeEnvironmentVariables.BOOTSTRAP_ADMIN_ENABLED" \
    --output text)"
  [ "$bootstrap" = "false" ] || die "Admin bootstrap is still enabled."
  python3 infra/aws/provision-identities.py provision-customer
  echo "Synthetic identities are ready. Passwords stay in ${IDENTITY_FILE}."
}

write_docs() {
  local lab_result="${1:-not-run}"
  cat > docs/aws-deployment.md <<EOF
# AWS deployment

This is an additional course deployment. It does not replace production.

| Item | Value |
| --- | --- |
| FINAL_SOURCE_SHA | ${APP_SHA} |
| AWS account | ${ACCOUNT} |
| Region | us-east-1 |
| ECR repository | ${ECR_URI} |
| Image tag | ${IMAGE_TAG} and submission-final |
| App Runner service | ${SERVICE_NAME} |
| App Runner service ARN | ${SERVICE_ARN} |
| App Runner URL | ${BACKEND_URL} |
| S3 bucket | ${WEB_BUCKET} |
| CloudFront distribution | ${CF_ID} |
| CloudFront domain | ${CF_DOMAIN} |
| AWS deployed project | https://${CF_DOMAIN} |
| Database name | simple_bank_aws |
| Health | PASS |
| Readiness | UP, production, ${APP_SHA} |
| Public config | demoMode false |
| CORS allow | https://${CF_DOMAIN} |
| CORS deny | production Vercel, staging Vercel, https://evil.example |
| Demo seed | false |
| Admin bootstrap | false |
| Lab 01 | ${lab_result} |

Existing production remains:

- https://simple-bank-production.vercel.app
- https://simple-bank-api-production.onrender.com/api

Browser language and responsive screenshots are captured from a local browser after this script. Passwords, the Mongo URI, and the JWT are not recorded here.
EOF
  cat > "$STATE_FILE" <<EOF
CLOUDFRONT_DOMAIN=${CF_DOMAIN}
CLOUDFRONT_DISTRIBUTION_ID=${CF_ID}
AWS_BACKEND_URL=${BACKEND_URL}
APP_RUNNER_ARN=${SERVICE_ARN}
EOF
  chmod 600 "$STATE_FILE"
}

main() {
  require_tools
  verify_source
  verify_account
  probe_permissions
  ensure_ecr
  ensure_image
  ensure_web_bucket
  ensure_cloudfront
  allow_cloudfront_read
  ensure_secrets
  ensure_apprunner_roles
  apply_service false ""
  BACKEND_URL="https://${BACKEND_HOST}"
  verify_backend
  build_frontend
  publish_frontend
  wait_cloudfront
  verify_edges
  provision_users
  local lab_result="PASS"
  if ! bash infra/aws/lab01.sh; then
    lab_result="FAILED"
    write_docs "$lab_result"
    die "The bank deployment is up. Lab 01 did not pass."
  fi
  write_docs "$lab_result"
  echo "AWS_DEPLOYED_PROJECT_LINK=https://${CF_DOMAIN}"
}

main "$@"
