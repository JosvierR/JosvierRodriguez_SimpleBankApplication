# Production reviewer access

These accounts exist so a recruiter can click through production. They are synthetic identities in the production database. They are not the demo dataset from `docs/demo-credentials.txt`, and those demo passwords do not work here.

Open https://simple-bank-production.vercel.app and sign in. The first load can take about a minute while the API wakes up. Use the language switcher for English, Spanish, or French.

| Role | Name | Username | Password | What you should see |
| --- | --- | --- | --- | --- |
| Customer | Nora Review | `nora.review` | `Review!Nora2026#05` | Checking and savings, plus a $25 withdrawal sent to Leo |
| Customer | Leo Review | `leo.review` | `Review!Leo2026#06` | Checking account and the $25 deposit from Nora |
| Teller | Mia Review | `review.teller` | `Review!Teller2026#03` | Customer lookup and accounts. No admin screen |
| Manager | Marcus Review | `review.manager` | `Review!Manager2026#02` | Accounts, transfers, and audit history |
| Auditor | Leo Audit | `review.auditor` | `Review!Auditor2026#04` | Read-only accounts and audits. Deposits are refused |
| Admin | Ava Review | `review.admin` | `Review!Admin2026#01` | Identity list, role changes, and security audit |

After the one-time sample movement, Nora's checking balance is 1475.00 and her savings balance is 4200.00. Leo's checking balance is 825.00. Nora's history shows a $25 withdrawal and Leo's history shows a $25 deposit. A manager or auditor sees that movement in the audit log as a transfer.

Nora cannot open Leo's accounts. A new public registration stays unlinked until an administrator connects it, so it will not show these balances.

The provision script is `scripts/provision-production-reviewers.mjs`. It only creates or completes this roster. It does not turn on demo seed and it does not change any other customer.
