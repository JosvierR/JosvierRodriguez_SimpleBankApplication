# AWS deployment

STATUS: PREPARED FOR MANUAL AWS CONSOLE DEPLOYMENT

CloudShell is not available in the QuickLabs account. No AWS resources have been created for this package yet. Do not record an instance id or a CloudFront URL until the console steps are finished.

| Item | Value |
| --- | --- |
| FINAL_SOURCE_SHA | dafc89b4b804cddaa2f443a55b05d48ffa3bd921 |
| AWS account | 279249498881 |
| Region | us-east-1 |
| Console guide | [infra/aws/manual-console/03-aws-console-steps.md](../infra/aws/manual-console/03-aws-console-steps.md) |
| EC2 user data | [infra/aws/manual-console/01-ec2-user-data.sh](../infra/aws/manual-console/01-ec2-user-data.sh) |
| CloudFront function | [infra/aws/manual-console/02-cloudfront-spa-function.js](../infra/aws/manual-console/02-cloudfront-spa-function.js) |
| S3 bucket name | josvier-simple-bank-aws-web-279249498881 |
| EC2 name | josvier-simple-bank-aws |
| Security group | josvier-simple-bank-aws-sg |
| Database name | simple_bank_aws |
| Database user | simplebank_app, readWrite on simple_bank_aws only |
| Frontend package | artifacts/simple-bank-aws-frontend.zip (local, not committed) |
| Health | not run |
| Readiness | not run |
| CORS | same origin through CloudFront; no external origin configured |
| EN / ES / FR | not run |
| Responsive | not run |

Existing production remains:

- https://simple-bank-production.vercel.app
- https://simple-bank-api-production.onrender.com/api

MongoDB is not given a public port. Port 27017 must not be added to the security group.
