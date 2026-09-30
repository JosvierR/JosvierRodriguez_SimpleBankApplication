# Isolated demo dataset

The demo profile loads twenty synthetic identities into `simple_bank_demo`.
It does not write to the normal `simple_bank` database.

The passwords in `docs/demo-credentials.txt` are public fixtures.
They are valid only for that isolated dataset. Do not reuse them.

## Start

PowerShell:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build
```

The frontend is at http://localhost:3000 and the API at http://localhost:8080.
Seeding runs only when the Spring profile is `demo` and `DEMO_SEED_ENABLED=true`.
The credential file is mounted read-only at `/demo/demo-credentials.txt`.

## Reset

Set `DEMO_SEED_RESET=true` on the demo backend and start again.
Reset drops only the known collections in `simple_bank_demo`.
It refuses the normal database name `simple_bank`.

## Verify

```powershell
./scripts/verify-demo-users.ps1
```

The script logs each identity in and checks the username and role.
It does not print passwords.

## Stop

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml down
```
