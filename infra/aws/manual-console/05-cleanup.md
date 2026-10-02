# Cleanup

Do not run this while the course submission still needs the site. Delete resources in this order so CloudFront stops reading the bucket before the bucket disappears.

1. CloudFront: open the distribution and **Disable** it. Wait until the status is **Deployed** and the state is disabled. Then **Delete** the distribution. Wait until it disappears.
2. CloudFront: **Functions**, `josvier-simple-bank-aws-spa`, **Delete**.
3. CloudFront: **Origin access**, delete `josvier-simple-bank-aws-oac` after the distribution is gone.
4. S3: open `josvier-simple-bank-aws-web-279249498881`, **Empty** the bucket, then **Delete** the bucket.
5. EC2: **Instances**, select `josvier-simple-bank-aws`, **Instance state**, **Terminate instance**. Wait until the state is **Terminated**.
6. EC2: **Security Groups**, select `josvier-simple-bank-aws-sg`, **Delete security group**. This fails while the instance is still shutting down. Retry after it has terminated.

Nothing in this repository deletes those resources automatically.
