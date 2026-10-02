# AWS course deployment

This deployment is additional. It does not change the Vercel frontend or the Render API.

Run it from AWS CloudShell in `us-east-1`, on account `279249498881`.

```bash
git clone --branch ReactFrontend-BankApp-Making-RestCall-To-Backend \
  https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication.git
cd JosvierRodriguez_SimpleBankApplication
bash infra/aws/deploy.sh
```

Export `SIMPLE_BANK_AWS_MONGODB_URI` in that same CloudShell session before the script. Do not put the value in this file.

`SIMPLE_BANK_AWS_MONGODB_URI` must point at database `simple_bank_aws` with user `simple-bank-aws-user`. That user needs `readWrite` on `simple_bank_aws` only. The script stores the URI and a new JWT in SSM Parameter Store as SecureString values. It does not print them.

The application image is tagged `dafc89b4` from source SHA `dafc89b4b804cddaa2f443a55b05d48ffa3bd921`. The script refuses to build when application files differ from that SHA.

Passwords for `aws.admin` and `aws.customer.sender` are written only to `~/.simple-bank-aws-identities.json` in CloudShell. Do not commit that file and do not paste it into chat.

Lab 01 is a separate S3 notification function, `student-s3-logger`. It is not connected to the bank API.
