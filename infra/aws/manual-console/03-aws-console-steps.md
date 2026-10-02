# Manual AWS console deployment

CloudShell is not available in this QuickLabs account. Create the resources in the AWS Console. Do not create access keys.

This follows the course shape without copying its insecure parts:

- The EC2 lab's shell bootstrap becomes Amazon Linux user data for the existing Spring Boot image.
- The MongoDB lab's database stays on that same EC2, but only on the Docker network. Do not open port 27017.
- The REST API lab's single HTTPS entry point becomes CloudFront. `/api/*` goes to EC2 port 8080.
- The full-stack frontend lab's private S3 bucket is served by CloudFront with Origin Access Control.

The application source inside the instance is exactly `dafc89b4b804cddaa2f443a55b05d48ffa3bd921`. Account `279249498881`. Region `us-east-1`.

Existing production stays on https://simple-bank-production.vercel.app and https://simple-bank-api-production.onrender.com/api.

## A. Region

1. Sign in to the AWS Console for account `279249498881`.
2. In the top navigation bar, open the Region selector.
3. Choose **US East (N. Virginia)**, `us-east-1`.
4. Leave that region selected for every step below.

## B. S3 bucket

1. Open the **S3** console.
2. Choose **Create bucket**.
3. Bucket name: `josvier-simple-bank-aws-web-279249498881`.
4. AWS Region: **US East (N. Virginia) us-east-1**.
5. Object Ownership: **ACLs disabled (Bucket owner enforced)**.
6. Block Public Access settings: leave **Block all public access** checked.
7. Do not enable static website hosting. Leave bucket versioning off.
8. Choose **Create bucket**.

## C. Upload the frontend

On your computer, extract `artifacts/simple-bank-aws-frontend.zip`. The extracted folder must contain `index.html` and `assets/` side by side. It must not contain a `dist/` or `frontend/` folder.

1. Open the bucket `josvier-simple-bank-aws-web-279249498881`.
2. Choose **Upload**.
3. Choose **Add files** and select `index.html`.
4. Choose **Add folder** and select the `assets` folder.
5. Confirm the upload list shows `index.html` at the bucket root and object keys that start with `assets/`.
6. Do not upload the zip file itself.
7. Choose **Upload** and wait until it succeeds.

The bucket stays private. CloudFront will receive permission in step F.

## D. Security group

1. Open the **EC2** console.
2. In the left navigation, choose **Security Groups**.
3. Choose **Create security group**.
4. Security group name: `josvier-simple-bank-aws-sg`.
5. Description: `CloudFront to Simple Bank API`.
6. VPC: the default VPC.
7. Inbound rules: choose **Add rule**.
8. Type: **Custom TCP**.
9. Port range: `8080`.
10. Source type: **Prefix list**. Do not choose Anywhere-IPv4.
11. Source: search for `com.amazonaws.global.cloudfront.origin-facing` and select that AWS-managed prefix list.
12. Do not add a rule for port `27017`.
13. Do not add a rule for port `22`.
14. Leave the default outbound rule so the instance can clone GitHub and pull Docker images.
15. Choose **Create security group**.

If that prefix list is missing, or saving the rule returns an authorization error, stop. Do not open port 8080 to `0.0.0.0/0`. Report that the account cannot use the CloudFront origin-facing prefix list.

## E. EC2 instance

1. In the EC2 console, choose **Launch instance**.
2. Name: `josvier-simple-bank-aws`.
3. Application and OS Images: **Amazon Linux 2023 AMI**, architecture **64-bit (x86)**.
4. Instance type: **t3.small**. If t3.small is unavailable, choose **t3.micro**. The user-data script creates 2 GB of swap when memory is 2 GB or less and no swap file is already active.
5. Key pair: **Proceed without a key pair**. Permanent SSH is not required.
6. Network settings: choose **Edit**.
7. VPC: default VPC. Subnet: a default public subnet.
8. Auto-assign public IP: **Enable**.
9. Firewall: **Select existing security group**, then choose `josvier-simple-bank-aws-sg`.
10. Configure storage: `20` GiB, volume type **gp3**, **Encrypted**.
11. Advanced details:
    - Metadata version: **V2 only (token required)** when that option is shown.
    - Metadata response hop limit: `1`.
    - User data: paste the complete contents of `infra/aws/manual-console/01-ec2-user-data.sh`. Do not add passwords to it.
12. Choose **Launch instance**.

The first boot builds the Docker image and can take 15 to 25 minutes.

## Startup check

1. EC2, **Instances**, select `josvier-simple-bank-aws`.
2. Wait until the instance state is **Running** and status checks pass.
3. Copy the **Public IPv4 DNS**. It looks like `ec2-xx-xx-xx-xx.compute-1.amazonaws.com`. You will use it as the CloudFront API origin. Do not browse port 8080 from your own computer; the security group does not allow that.
4. **Actions**, **Monitor and troubleshoot**, **Get system log**.
5. Wait until the log contains this exact line:

```text
SIMPLE BANK AWS BACKEND READY
```

The same line is stored on the instance at `/opt/simple-bank/aws-status.txt`. The log must not contain a Mongo URI, a JWT, or a password. If it does, stop and treat that as a failure.

Do not open CloudFront until the system log contains `SIMPLE BANK AWS BACKEND READY`. A line that says `BOOTSTRAP FAILED` means this instance is not ready. The first boot can take 15 to 25 minutes because it builds the application image.

Amazon Linux 2023 already provides the `curl` command through `curl-minimal`. The bootstrap does not install the full `curl` package, because that package conflicts with `curl-minimal`. A failure that mentions `curl-minimal conflicts with curl` is from an older user-data script. Terminate that instance and launch again with the current `01-ec2-user-data.sh`.

Use **Connect**, **EC2 Instance Connect** only when the system log shows a bootstrap failure. Before connecting, add a temporary inbound TCP `22` rule whose source is **My IP**. Remove that rule as soon as you disconnect. Do not leave SSH open.

## F. CloudFront

1. Open the **CloudFront** console.
2. Choose **Create distribution**.

### Origin 1, private S3

1. Origin domain: `josvier-simple-bank-aws-web-279249498881.s3.us-east-1.amazonaws.com`.
2. Name: `simple-bank-frontend`.
3. Origin access: **Origin access control settings (recommended)**.
4. Choose **Create new OAC**. Name it `josvier-simple-bank-aws-oac`, sign requests, and origin type **S3**.
5. Default cache behavior: origin `simple-bank-frontend`.
6. Viewer protocol policy: **Redirect HTTP to HTTPS**.
7. Allowed methods for this default behavior: **GET, HEAD**.
8. Cache policy: **CachingOptimized** is acceptable for hashed assets. `index.html` in the zip is replaced by the viewer-request function for extensionless routes.
9. Default root object: `index.html`.
10. Choose **Create distribution**.
11. CloudFront shows a banner that the S3 bucket policy must be updated. Choose **Copy policy**.
12. Open S3, the bucket, **Permissions**, **Bucket policy**, **Edit**.
13. Paste the copied policy and save it. It grants `s3:GetObject` to `cloudfront.amazonaws.com` only when `AWS:SourceArn` is this distribution. Do not add a `Principal` of `*`.
14. Confirm **Block all public access** is still enabled.

The copied policy has this shape. Use the policy CloudFront copied, including its real distribution id:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": { "Service": "cloudfront.amazonaws.com" },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::josvier-simple-bank-aws-web-279249498881/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::279249498881:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

### Origin 2, EC2 API

1. Open the distribution, **Origins**, **Create origin**.
2. Origin domain: the EC2 **Public IPv4 DNS** copied above. Do not use the public IP.
3. Protocol: **HTTP only**.
4. HTTP port: `8080`.
5. Name: `simple-bank-api`.
6. Leave Origin Shield off.
7. Choose **Create origin**.

### `/api/*` behavior

1. **Behaviors**, **Create behavior**.
2. Path pattern: `/api/*`.
3. Origin: `simple-bank-api`.
4. Viewer protocol policy: **Redirect HTTP to HTTPS**.
5. Allowed HTTP methods: **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE**.
6. Cache policy: **CachingDisabled**.
7. Origin request policy: **AllViewerExceptHostHeader**.
8. Do not associate a CloudFront Function with this behavior.
9. Choose **Create behavior**.

### SPA function

1. CloudFront, **Functions**, **Create function**.
2. Name: `josvier-simple-bank-aws-spa`.
3. Runtime: **cloudfront-js-2.0**.
4. Paste `infra/aws/manual-console/02-cloudfront-spa-function.js`.
5. Choose **Save**.
6. Open **Test**. Use a viewer-request event and check three URIs:
   - `/login` becomes `/index.html`.
   - `/assets/index.js` stays `/assets/index.js`.
   - `/api/public/health` stays `/api/public/health`.
7. Choose **Publish**.
8. Return to the distribution, **Behaviors**, select the **Default (`*`)** behavior, **Edit**.
9. Function associations, **Viewer request**: **CloudFront Functions**, function `josvier-simple-bank-aws-spa`.
10. Save. Do not add that function to the `/api/*` behavior.

## Deployment wait

1. Stay on the distribution until **Last modified** shows **Deployed**. This often takes 5 to 15 minutes.
2. Copy the distribution domain name, `dxxxxxxxxxxxxx.cloudfront.net`.

## Public checks

Open these URLs in a browser:

- `https://DISTRIBUTION_DOMAIN/`
- `https://DISTRIBUTION_DOMAIN/login`
- `https://DISTRIBUTION_DOMAIN/app`

Each page must load the React application. Refresh `/login` directly. It must still load the application, not an S3 error.

Then open:

- `https://DISTRIBUTION_DOMAIN/api/public/health`

The body contains `"status":"UP"`.

Then open:

- `https://DISTRIBUTION_DOMAIN/api/public/ready`

The body contains `"status":"UP"`, `"environment":"production"`, and `"revision":"dafc89b4b804cddaa2f443a55b05d48ffa3bd921"`.

Continue with `04-verification.md` before recording the distribution id and domain in `docs/aws-deployment.md`.
