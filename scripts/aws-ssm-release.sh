#!/bin/bash
set -euo pipefail
instance="$(terraform -chdir=infra/terraform/environments/production output -raw instance_id)"
sha="${RELEASE_SHA:?RELEASE_SHA is required}"
b64="$(base64 -w0 infra/aws/deploy-release.sh)"
params="$(jq -n --arg b64 "$b64" --arg sha "$sha" '{commands: ["echo " + $b64 + " | base64 -d > /opt/simple-bank/deploy-release.sh", "chmod 755 /opt/simple-bank/deploy-release.sh", "/opt/simple-bank/deploy-release.sh " + $sha]}')"
command_id="$(aws ssm send-command --instance-ids "$instance" --document-name AWS-RunShellScript --comment "simple-bank-release" --parameters "$params" --query Command.CommandId --output text)"
aws ssm wait command-executed --command-id "$command_id" --instance-id "$instance"
status="$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$instance" --query Status --output text)"
echo "ssm status=${status}"
test "$status" = "Success"
