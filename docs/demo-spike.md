# Isolated demo dataset

The demo profile loads twenty synthetic identities into `simple_bank_demo`.
It does not write to the normal `simple_bank` database.

The passwords in `docs/demo-credentials.txt` are public fixtures.
They are valid only for that isolated dataset. Do not reuse them.
Do not screenshot that file or paste the passwords into logs.

## Normal mode

```powershell
docker compose up --build
```

This uses `simple_bank`. Demo seeding stays off unless the Spring profile is `demo` and `DEMO_SEED_ENABLED=true`.
`GET /api/public/config` reports `demoMode: false`.

Verified before the demo run: the normal database had 12 customers, 16 accounts, 38 transactions, 26 banking audits, 17 auth users, and 15 security audits. It did not contain `ava.admin` or any `@demo.simplebank.test` email.

## Demo mode

PowerShell:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build
```

The frontend is at http://localhost:3000 and the API at http://localhost:8080.
The backend must report the `demo` profile and the database name `simple_bank_demo`.
The credential file is mounted read-only at `/demo/demo-credentials.txt`.
It is not copied into the image.

## Dataset

Version `product-spike-v1` is stored in `demo_seed_metadata` with `status=COMPLETE` and `createdAt` only after every invariant passes.

| Collection | Count |
| --- | --- |
| Auth users | 20 |
| Bank customers | 12 |
| Accounts | 21 |
| Transactions | 78 |
| Banking audits | 60 |
| Security audits | 4 |

Roles: 1 administrator, 2 managers, 3 tellers, 2 auditors, 12 customers.
All 12 customer identities are linked. All 8 staff identities are unlinked.
Usernames and emails are unique. Password fields are BCrypt hashes. Documents do not store a plaintext password.

If a complete marker already exists, startup checks the same invariants and stops when they fail.
It does not insert another copy. Partial data without a complete marker is refused until `DEMO_SEED_RESET=true`.

## Reset

Set `DEMO_SEED_RESET=true` on the demo backend and start again.
Reset drops only the known collections in `simple_bank_demo`.
It refuses the normal database name `simple_bank`.
Return the variable to `false` afterward. The committed compose file keeps it `false`.

A live reset recreated 20 auth users, 12 customers, 21 accounts, 78 transactions, 60 banking audits, and 4 security audits.
A later start with reset left `false` reported the dataset already complete and did not change those counts.

## Isolation

The normal database counts above were compared again after demo start, demo restart, and demo reset.
They were unchanged.

## Verify

```powershell
./scripts/verify-demo-users.ps1
```

The script logs each identity in and checks the username and role.
It does not print passwords.
The live run authenticated 20/20 with the role counts above.

## Languages

The interface supports English, Español, and Français.
The choice is stored in `simple-bank-language` and survives reload.
`document.documentElement.lang` follows that choice.
Routes and API enum values stay in English.

## Stop

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml down
```
