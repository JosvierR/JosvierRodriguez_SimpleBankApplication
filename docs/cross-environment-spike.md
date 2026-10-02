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

Mutation mode stops unless Sofia checking is `3200.00` and Ethan checking is `1850.00`.
It then deposits and withdraws `1.00`, `10.25`, and `100.10`, which net to zero, and submits one `1.00` transfer.
A later mutation run refuses because those accounts are no longer at the pristine targets.
`SPIKE_KNOWN_POST_SPIKE=true` lets the provisioner leave the known post-transfer balances untouched. It does not move money back to the original target.

`scripts/spike/browser-spike.mjs` drives Chromium, switches English, Spanish, and French in the page, and checks the staged widths when `SPIKE_BROWSER_RESPONSIVE=true`.

`ENV_NAME=development` expects public environment `local` or `demo`.
`staging` and `production` must report that environment and `demoMode=false`.

`SPIKE_CORS_ALLOW` is the one origin that must be accepted.
`SPIKE_CORS_DENY` is a comma-separated list that must be rejected.
`https://evil.example` is always checked and must not be allowed.

Hosted language checks need `FRONTEND_URL`. They look for the English, Spanish, and French account-number labels in the built frontend.

## Controlled transfers

Each environment submitted one `1.00` transfer from Sofia checking to Ethan checking. Deposit `1.00`, `10.25`, and `100.10`, then the matching withdrawals, netted to zero before that transfer. A second mutation run was refused in development and production because the accounts were no longer at the pristine targets.

| Environment | Before Sofia / Ethan | After Sofia / Ethan | Reference |
| --- | --- | --- | --- |
| Development `simple_bank_demo` | 3200.00 / 1850.00 | 3199.00 / 1851.00 | `TRF-87B8C8615548` |
| Staging `simple_bank_staging` | 3200.00 / 1850.00 | 3199.00 / 1851.00 | `TRF-E3266EAFE98F` |
| Production `simple_bank_prod` | 3200.00 / 1850.00 | 3199.00 / 1851.00 | `TRF-2D144E8E1CAA` |

Generated account numbers differ. Staging masked the destination as ending 2885. Production masked it as ending 3362. The sender still received 404 for the foreign account and its history.

Staging was provisioned and verified by https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/37016585005 using `stg.admin`. The admin password stayed in the staging environment.

## Matrix

| Test | DEV | STG | PROD |
| --- | --- | --- | --- |
| Health | PASS | PASS | PASS |
| Config | PASS | PASS | PASS |
| 20 logical identities | PASS | PASS | PASS |
| Role distribution | PASS | PASS | PASS |
| Customer login | PASS | PASS | PASS |
| Teller positive permission | PASS | PASS | PASS |
| Teller negative permission | PASS | PASS | PASS |
| Manager positive permission | PASS | PASS | PASS |
| Manager negative permission | PASS | PASS | PASS |
| Auditor positive permission | PASS | PASS | PASS |
| Auditor mutation 403 | PASS | PASS | PASS |
| Admin permission | PASS | PASS | PASS |
| Dashboard | PASS | PASS | PASS |
| Own accounts | PASS | PASS | PASS |
| Ownership 404 | PASS | PASS | PASS |
| Foreign history 404 | PASS | PASS | PASS |
| Deposit | PASS | PASS | PASS |
| Withdraw | PASS | PASS | PASS |
| Transfer preview privacy | PASS | PASS | PASS |
| Transfer submit | PASS | PASS | PASS |
| Ledger pair | PASS | PASS | PASS |
| Invalid JWT 401 | PASS | PASS | PASS |
| Missing JWT 401 | PASS | PASS | PASS |
| Wrong role 403 | PASS | PASS | PASS |
| CORS isolation | PASS | PASS | PASS |
| EN browser | PASS | PASS | PASS |
| ES browser | PASS | PASS | PASS |
| FR browser | PASS | PASS | PASS |
| Responsive |  | PASS | PASS |
| Console | PASS | PASS | PASS |

## Screenshots

Captured in `docs/screenshots/cross-environment-spike/`.

Development responsive widths were not part of this run. Staging and production were checked at 1440, 1024, 768, 430, 390, and 360. The files are `01-dev-dashboard.png` through `20-production-mobile-390.png`, including dashboards, admin, teller, manager, auditor, masked previews, ledgers, production readiness, the green baseline promotion, and the 390px mobile views.

The images show usernames, owned account numbers, and masked destinations. They do not show passwords, tokens, database URIs, or deploy hooks.
