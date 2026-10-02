# Cross-environment spike

The logical dataset is `product-spike-v1` from the development demo identities.
Staging and production must not run `DemoDataSeeder`. That seeder stays on the `demo` profile.

Same logical user means the same username, name, email, role, customer or staff purpose, account types, and starting-balance target.
Passwords, JWTs, MongoDB ids, and generated account numbers stay different in each environment.
No database copy and no password hash copy.

## Files

| Piece | Path |
| --- | --- |
| Manifest | `scripts/spike/product-spike-manifest.json` |
| Provisioner | `scripts/spike/provision-spike.mjs` |
| Verifier | `scripts/spike/verify-spike.mjs` |

The manifest has 20 identities: 1 `ADMIN`, 2 `MANAGER`, 3 `TELLER`, 2 `AUDITOR`, and 12 `CUSTOMER`.
Staff identities have no account plan. Customer account numbers are created by the API.

Comparable starting targets from the development dataset:

| Identity | Account | Target |
| --- | --- | --- |
| `sofia.rivera` | CHECKING | 3200.00 |
| `sofia.rivera` | SAVINGS | 12000.00 |
| `ethan.parker` | CHECKING | 1850.00 |

The controlled transfer pair is `sofia.rivera` CHECKING to `ethan.parker` CHECKING for `1.00`.

## Passwords

Passwords are not in git.
Put a JSON object of username to password in a file outside the repository and point `SPIKE_PASSWORDS_FILE` at it.
Use a different password set for development, staging, and production.
Do not reuse `docs/demo-credentials.txt` outside the local demo profile.

An existing admin must already be able to log in. The provisioner uses that admin to reconcile the manifest.
It registers missing users, sets roles, links customers, opens missing account types, and deposits a starting target only when the new account balance is still `0.00`.
It does not drop data, enable demo seed, or delete users.

```powershell
$env:API_BASE_URL = "https://example/api"
$env:ENV_NAME = "production"
$env:SPIKE_ADMIN_USERNAME = "prod.admin"
$env:SPIKE_ADMIN_PASSWORD = "<from the secret store>"
$env:SPIKE_PASSWORDS_FILE = "$env:TEMP\spike-passwords.json"
node scripts/spike/provision-spike.mjs
```

## Verifier

The verifier is read-only unless `ALLOW_SPIKE_MUTATION=true`.
Without that flag it still runs login, dashboard, account reads, ownership checks, and transfer preview.
It does not submit deposit, withdraw, or transfer.

`ENV_NAME=development` expects public environment `local` or `demo`.
`staging` and `production` must report that environment and `demoMode=false`.

`SPIKE_CORS_ALLOW` is the one origin that must be accepted.
`SPIKE_CORS_DENY` is a comma-separated list that must be rejected.
`https://evil.example` is always checked and must not be allowed.

Hosted language checks need `FRONTEND_URL`. They look for the English, Spanish, and French account-number labels in the built frontend.

## Matrix

These cells stay blank until that check is executed in that environment.

| Test | DEV | STG | PROD |
| --- | --- | --- | --- |
| Health | | | |
| Config | | | |
| Customer login | | | |
| Teller RBAC | | | |
| Manager RBAC | | | |
| Auditor RBAC | | | |
| Admin RBAC | | | |
| Dashboard | | | |
| Own accounts | | | |
| Ownership 404 | | | |
| Deposit | | | |
| Withdraw | | | |
| Transfer preview | | | |
| Transfer submit | | | |
| Ledger pair | | | |
| Invalid JWT 401 | | | |
| Wrong role 403 | | | |
| CORS isolation | | | |
| EN | | | |
| ES | | | |
| FR | | | |

## Screenshots

Capture these later under `docs/screenshots/cross-environment-spike/` after the identities exist in each environment:

- `dev-dashboard.png`
- `staging-dashboard.png`
- `production-dashboard.png`
- `dev-admin.png`
- `staging-admin.png`
- `production-admin.png`
- `staging-transfer-preview.png`
- `production-transfer-preview.png`
- `production-ready.png`
- `production-actions-green.png`

Do not include passwords, tokens, or database URIs.
