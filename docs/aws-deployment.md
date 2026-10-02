# AWS deployment

Status: not deployed from this workstation.

The AWS CLI is not installed here, and there is no local AWS credential file. The QuickLabs console password is not stored and is not converted into access keys. Deploy from CloudShell with `infra/aws/deploy.sh`. That script overwrites this page with the live resource identifiers.

| Item | Value |
| --- | --- |
| FINAL_SOURCE_SHA | dafc89b4b804cddaa2f443a55b05d48ffa3bd921 |
| AWS account | 279249498881 |
| Region | us-east-1 |
| ECR repository | josvier-simple-bank-api |
| Image tag | dafc89b4 and submission-final |
| App Runner service | josvier-simple-bank-api |
| S3 bucket | josvier-simple-bank-web-279249498881 |
| CloudFront comment | Josvier Simple Bank AWS Submission |
| Database name | simple_bank_aws |
| Database user | simple-bank-aws-user, readWrite on simple_bank_aws only |
| Health | not run |
| Readiness | not run |
| CORS | not run |
| EN / ES / FR | not run |
| Responsive | not run |
| Lab 01 bucket | student-josvier-rodriguez-uploads |
| Lab 01 function | student-s3-logger |

Existing production stays on:

- https://simple-bank-production.vercel.app
- https://simple-bank-api-production.onrender.com/api

The Atlas CLI session on this workstation is expired, so this repository does not contain a Mongo URI. Export `SIMPLE_BANK_AWS_MONGODB_URI` inside CloudShell before running the script. Do not paste that URI into chat.
