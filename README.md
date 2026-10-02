# Simple Bank Application

[![CI](https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/workflows/ci.yml/badge.svg?branch=ReactFrontend-BankApp-Making-RestCall-To-Backend)](https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/workflows/ci.yml?query=branch%3AReactFrontend-BankApp-Making-RestCall-To-Backend)

React, Spring Boot, and MongoDB Atlas. Sign-in uses a JWT. Passwords are BCrypt hashes. Five roles share one bank. A customer sees only their own accounts and can transfer internally by a public account number. GitHub Actions tests the backend, the frontend, and both Docker images before a commit is eligible for staging.

## Navigate

| Question | Page |
| --- | --- |
| How the system is shaped | [C4 architecture](docs/c4-architecture.md), [layers](docs/system-architecture.md), [zoomed diagrams](docs/c4/README.md) |
| How a transfer works | [Transfer flow](docs/transfer-flow.md) |
| What each dashboard shows | [Dashboard design](docs/dashboard-design.md) |
| Local, demo, staging, production | [Environments](docs/deployment-environments.md), [staging runbook](docs/staging-runbook.md), [acceptance](docs/staging-acceptance.md) |
| What to show in class | [Final presentation](docs/final-presentation-runbook.md), [checklist](docs/final-presentation-checklist.md) |
| Trainer mapping | [Requirements](docs/trainer-requirements.md), [answers](docs/trainer-qa.md), [12-minute order](docs/trainer-demo-runbook.md) |
| API calls | [Postman collection](postman/SimpleBank_Backend_API.postman_collection.json) |
| Links to paste | [Submission links](docs/submission-links.md) |
| AWS course submission | [AWS deployment](docs/aws-deployment.md), [Terraform](docs/terraform.md) |
| DevOps platform | [Platform](docs/devops-platform.md), [Playwright](docs/playwright.md), [Jenkins](docs/jenkins.md), [Observability](docs/observability.md) |

Canonical branch: `ReactFrontend-BankApp-Making-RestCall-To-Backend`. Staging and production stay on an approved SHA. Existing production remains https://simple-bank-production.vercel.app with the API at https://simple-bank-api-production.onrender.com/api. The AWS course deployment is separate and does not replace it.

## Current Phase

**Banking experience: executive public home, server-aggregated dashboards, responsive workflows, and an isolated demo**

The project evolved in seven focused phases:

1. Phase 1 — in-memory customers, accounts, balances, and transactions.
2. Phase 2 — MongoDB Atlas persistence with ObjectId identifiers, Decimal128 money, indexes, and transactional money movement.
3. Phase 3 — stateless JWT authentication, BCrypt credentials, and authenticated audit actors.
4. Phase 4 — React operations UI, real API integration, and full-stack Docker support.
5. Phase 5 — CUSTOMER, TELLER, MANAGER, AUDITOR, and ADMIN permissions, customer-owned data, security audit, and role-specific workspaces.
6. Phase 6 — public landing at `/`, authenticated product under `/app`, adaptive tables, and en/es/fr.
7. Phase 7 — premium banking homepage, `GET /api/dashboard`, role-specific experiences, real money-movement charts, and architecture documentation.

`docs/demo-credentials.txt` contains intentionally public synthetic credentials. Never reuse them. They are valid only in the isolated `simple_bank_demo` dataset. See `docs/demo-spike.md`.

The interface follows Apple Human Interface Guidelines as design principles, not as a copy of Apple. Color uses Radix Colors through semantic tokens. Interaction uses Radix primitives. Dense operational tables use TanStack Table. Styling is custom CSS. This project is not affiliated with Apple.

Language preference is stored in `localStorage` under `simple-bank-language`. The access token stays in `sessionStorage`. The selector offers English, Español, and Français. Frontend-owned interface copy, including labels, empty states, dialogs, and accessibility text, is localized in those three languages. Backend API messages stay in the language the API returns. The browser language is used when no preference is saved, and English is the fallback. Logout does not clear the language.

Desktop uses a light split view. Narrower widths replace the sidebar with an accessible sheet. Data tables become stacked records on small screens.

Normal startup uses `simple_bank` and does not seed demo users:

```powershell
docker compose up --build
```

Demo startup uses `simple_bank_demo`:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build
```

Old bookmarks such as `/customers` and `/accounts` redirect to `/app/customers` and `/app/accounts`. Routes stay in English when the language changes.

## Trainer / coursework alignment

The classroom checklist is mapped in [docs/trainer-requirements.md](docs/trainer-requirements.md). A 12-minute screen-share order is in [docs/trainer-demo-runbook.md](docs/trainer-demo-runbook.md). Short oral answers are in [docs/trainer-qa.md](docs/trainer-qa.md).

The Postman collection is [postman/SimpleBank_Backend_API.postman_collection.json](postman/SimpleBank_Backend_API.postman_collection.json). The local environment file leaves passwords blank. Copy demo usernames and passwords from `docs/demo-credentials.txt` into Postman on your machine. The submission branch to paste after push is `ReactFrontend-BankApp-Making-RestCall-To-Backend`. See [docs/submission-links.md](docs/submission-links.md).

Bank customers and API logins stay separate. A record in `users` owns bank accounts. A record in `auth_users` proves that a person may call the API. Registration creates a Customer login. It does not create a bank customer, and it does not grant staff or admin authority.

## AWS Deployment

This is an additional deployment for the AWS course. It does not replace the Vercel and Render production environment.

Production frontend: https://simple-bank-production.vercel.app

Production backend: https://simple-bank-api-production.onrender.com/api

The course site is prepared for the AWS Console because CloudShell is not available. Follow [the manual steps](infra/aws/manual-console/03-aws-console-steps.md). The public link is recorded in [docs/aws-deployment.md](docs/aws-deployment.md) only after CloudFront is deployed.

```text
CloudFront
  -> private S3 frontend
  -> /api/* to EC2 :8080 Spring Boot
  -> MongoDB on the same Docker network
```

## Architecture

```text
Browser
  ↓
React 19 + React Router
  ↓
Nginx (Docker) / Vite proxy (local development)
  ↓
Spring Security JWT
  ↓
Controllers
  ↓
Services and banking rules
  ↓
Repository adapters
  ↓
MongoDB Atlas
```

Container and component diagrams are in [docs/c4-architecture.md](docs/c4-architecture.md). The internal transfer sequence is in [docs/transfer-flow.md](docs/transfer-flow.md).

The React application calls relative `/api` URLs in local development and Docker. Vite proxies those calls to `localhost:8080`; Nginx proxies them to the `backend` service. A hosted Vercel frontend sets the public `VITE_API_BASE_URL` and the API allows only that exact origin through `CORS_ALLOWED_ORIGINS`. There is no wildcard CORS entry.

## Environments / Deployment

Local, demo, staging, and production share this source. They differ by Spring profile, database name, and frontend origin. Canonical is the source of truth. Staging is the tested promotion branch. Production is an approved staging SHA only.

- [Environment model](docs/deployment-environments.md)
- [Staging runbook](docs/staging-runbook.md)
- [Staging acceptance](docs/staging-acceptance.md)

Historical snapshots stay on `bankapp-Java-Springboot-Backend-API-MVC`, `SpringbootRESTApiBackend-With-DB-MongoDBCloudAtlas`, and `SpringbootRESTApiBackend-With-DB-MongoDBCloudAtlas-With-JWT`. The canonical application is `ReactFrontend-BankApp-Making-RestCall-To-Backend`. Release branches are `staging` and `deploy/vercel-production`.

Zoomed architecture diagrams, with an explanation of each part, are in [docs/c4/README.md](docs/c4/README.md). The layer overview in [docs/system-architecture.md](docs/system-architecture.md) stays the short companion.

## Technology

Frontend:

- React 19, TypeScript, Vite, and React Router
- Recharts for customer and manager money-movement charts, loaded only with the lazy dashboard route
- Handcrafted CSS design system and a small Lucide icon set
- Vitest, React Testing Library, user-event, and jsdom
- Nginx static runtime and reverse proxy

Backend:

- Java 17, Spring Boot 4, Spring MVC, Validation, and Spring Security
- JJWT with HMAC SHA-256 and BCrypt password hashes
- Spring Data MongoDB and MongoDB Atlas
- Maven, JUnit 5, Mockito, and MockMvc
- Springdoc OpenAPI / Swagger UI

## Frontend Experience

Each verified role sees its own navigation and a dashboard shaped around its immediate work. `GET /api/dashboard` derives the role from the current persisted actor and returns a minimal role-specific DTO; the browser does not choose a role or assemble broad collections.

- Customer: personal balance, owned accounts, recent activity, 30-day deposits/withdrawals, and transfers
- Teller: customer/account search, today’s personal operation totals, account opening, and actor-scoped recent work
- Manager: total bank position, account mix, 30-day money movement, transfer access, and banking audit activity
- Auditor: read-only audit counts, actor visibility, action breakdown, and investigation paths
- Admin: identity health, role distribution, customer links, security changes, and concise banking context

The visual system uses system typography, a light split-view navigation, a restrained blue accent, low-shadow grouped surfaces, and Radix accessibility primitives. The layout is responsive on desktop and in a mobile navigation sheet. This is Apple-like restraint. It is not affiliated with Apple.

Balances, customers, accounts, transactions, and audits come from the Spring API. Charts use only persisted 30-day data and always include a textual summary. The public product preview is structural and uses neutral values; production components contain no demo financial data.

Deep architecture and product rationale are documented in [docs/system-architecture.md](docs/system-architecture.md) and [docs/dashboard-design.md](docs/dashboard-design.md).

## Authentication and Authorization

Public routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `/login`
- `/register`

The browser stores only the returned token in `sessionStorage`. It never uses `localStorage`, displays the token, or decodes JWT claims as its authorization source. On reload, `GET /api/auth/verify` restores the username, primary role, and customer-link state from the backend. Any authenticated request that returns `401` clears the token and returns the user to login.

Public registration always receives `CUSTOMER`. There is no role selector and no built-in admin password. Permissions are decided in `RolePermissions` and checked through `BankAuthorizationService`. Controllers do not scatter role-string comparisons through the banking services.

Passwords must contain at least 8 characters and no more than 72 UTF-8 bytes. Register and login responses use `Cache-Control: no-store`. `JWT_SECRET` must decode from Base64 to at least 256 bits and has no application default.

## Ownership

```text
auth_users
   bankUserId
      ↓
users
      ↓
accounts
      ↓
transactions
```

A Customer login sees only the bank customer named by `bankUserId`, and only the accounts and transactions that belong to that customer. Matching email addresses are not linked automatically. An administrator must connect the login explicitly. A bank customer can be linked to one Customer login; a second link returns `409`.

A Customer login with `bankUserId = null` can sign in and pass verify, then sees “Bank profile connection pending.” It does not receive customers, accounts, balances, or audits.

Each account has a public 12-digit `accountNumber`. It is not the MongoDB id. Customers use that number to send an internal transfer to another account in the same bank, including an account owned by someone else. That command does not grant read access. The sender still cannot open the destination account, its history, or the other customer. Preview returns a masked number and a first-name plus last-initial confirmation only. Details are in [docs/transfer-flow.md](docs/transfer-flow.md).

## Role matrix

| Area | Customer | Teller | Manager | Auditor | Admin |
| --- | --- | --- | --- | --- | --- |
| Own profile and accounts | Yes | — | — | — | — |
| All customers and accounts | No | Read / create | Read / create / update / delete | Read | Yes |
| Transaction history | Own | Yes | Yes | Yes | Yes |
| Deposit and withdraw | No | Yes | Yes | No | Yes |
| Transfer | Own accounts | No | Yes | No | Yes |
| Banking audit | No | No | Yes | Yes | Yes |
| Access management | No | No | No | No | Yes |
| Security audit | No | No | No | No | Yes |

`USER` remains only for older logins. It is treated as a legacy Customer. An unlinked legacy `USER` gets the same pending-link state. New registrations do not create `USER`.

## 403 and 404

`403` means the role cannot use that feature. Examples: a Customer calls `GET /api/accounts`, an Auditor posts a deposit, or a Teller calls `/api/admin/auth-users`.

`404` means a Customer asked for an object that is not theirs. The response says the resource was not found. It does not say that the object belongs to someone else. Customer reads use `findByIdAndUserId(accountId, bankUserId)` rather than loading an account and then comparing owners.

## Access management

Administrators use Access management to assign one primary role, enable or disable a login, and link or unlink a bank customer. Disabling a login rejects that token on the next request with `401`, because the filter reloads the current identity.

The last enabled administrator cannot be disabled or moved to another role. That attempt returns `409`.

Admin bootstrap is off unless `BOOTSTRAP_ADMIN_ENABLED=true`. When it is on, and no enabled administrator exists, the existing login named by `BOOTSTRAP_ADMIN_USERNAME` is promoted. Bootstrap never creates a password, never logs credentials, and does nothing on later restarts once an enabled administrator exists. Turn `BOOTSTRAP_ADMIN_ENABLED` back to `false` after that promotion.

## Banking audit and security audit

Banking audits stay in the money-movement collection. A deposit, withdrawal, or transfer records the bank customer, the authenticated actor, account ids, transaction ids, amount, and time. Rejected movements do not create an audit.

Security administration is a separate `security_audits` collection: `ROLE_CHANGED`, `AUTH_USER_ENABLED`, `AUTH_USER_DISABLED`, `CUSTOMER_LINKED`, `CUSTOMER_UNLINKED`, and `ADMIN_BOOTSTRAPPED`. Each row stores the actor, target login, previous value, new value, and time. It never stores a password, password hash, or token.

## Production limitations

This remains an educational project. It does not implement KYC, AML, MFA, real banking rails, a PCI environment, regulatory certification, deposit insurance, fraud detection, or maker-checker approval.

A production design could add step-up authentication, fraud and risk checks, transaction limits, beneficiaries, dual approval, KYC/AML, and device or session management. The frontend Nginx image follows the standard image user. That is acceptable for this educational deployment. The backend runtime user is the non-root account `bankapp`.

## UI Workflows

- **Login / Register** — authenticate or create a standard API access account.
- **Dashboard** — receive one server-authorized role DTO and open a customer, teller, manager, auditor, or administrator experience designed for that role’s immediate work.
- **Create account** — choose New Customer to create `users` then `accounts`, or Existing Customer to add another account. A partial failure preserves the newly created customer and offers recovery.
- **Customer details** — inspect the profile and every account owned by that customer.
- **Account details** — view the current balance and protected metadata, change only the account type, or navigate to money operations.
- **Deposit / Withdraw** — validate a positive two-decimal amount, submit it to the backend, and show the returned new balance.
- **Transaction history** — display transaction ID, type, amount, and date; deposit/withdrawal text accompanies the visual treatment.
- **Transfer** — select different source and destination accounts, submit an amount, and show both returned balances plus the audit ID.
- **Audits** — view the customer affected, API actor, accounts, amount, action, and timestamp; older null actors appear as `Legacy / unavailable`.

## React Frontend Requirement Mapping

| Class UI requirement | React implementation |
| --- | --- |
| Public Home | `LandingPage` at `/` |
| Authenticated Dashboard | `DashboardPage` at `/app` |
| Create Account | `CreateAccountPage` at `/app/accounts/new` |
| Account Details | `AccountDetailsPage` at `/app/accounts/:accountId` |
| Deposit | `DepositPage` at `/app/accounts/:accountId/deposit` |
| Withdraw | `WithdrawPage` at `/app/accounts/:accountId/withdraw` |
| Transaction History | `TransactionHistoryPage` at `/app/accounts/:accountId/transactions` |

Additional authenticated routes live under `/app`, including customers, accounts, transfers, audits, and admin access management. Compatibility redirects preserve old bookmarks such as `/accounts` without treating them as the canonical route structure.

## Project Structure

```text
frontend/
  public/
  src/
    app/            router, route guards, and application providers
    features/
      access-management/
      accounts/
      audits/
      auth/
      customer-portal/
      customers/
      dashboard/
      landing/
      transactions/
      transfers/
    shared/
      api/          centralized request transport
      auth/         verified browser session state
      components/   reusable behavior and display primitives
      i18n/         EN/ES/FR resources and language state
      layout/       authenticated application shell
      pages/        shared route-level pages
      types/        backend API contracts
      utils/        currency, date, amount, and error helpers
    styles/         tokens, global rules, components, and breakpoints
  Dockerfile
  nginx.conf
src/main/java/com/josvier/simplebank/
  auth/
  dashboard/       role-derived aggregation and minimal dashboard DTOs
  security/
  controller/
  service/
  repository/
  dto/
  model/
src/test/java/com/josvier/simplebank/
Dockerfile
docker-compose.yml
```

## Environment

Copy the variable names from `.env.example` into your shell or a local ignored `.env` file. Never commit real values.

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas connection string |
| `MONGODB_DATABASE` | No | Database name; defaults to `simple_bank` |
| `JWT_SECRET` | Yes | Base64-encoded HMAC secret of at least 256 bits |
| `JWT_EXPIRATION_MS` | No | Token lifetime; defaults to `3600000` |
| `BOOTSTRAP_ADMIN_ENABLED` | No | Defaults to `false`. Enable only for a one-time promotion |
| `BOOTSTRAP_ADMIN_USERNAME` | No | Existing login to promote when bootstrap is enabled |
| `FRONTEND_PORT` | No | Docker host port; defaults to `3000` |
| `BACKEND_PORT` | No | Docker host port; defaults to `8080` |

Vite exposes only `VITE_API_BASE_URL=/api`. MongoDB and JWT secrets are runtime backend variables and are never frontend build arguments.

## Run with Docker

PowerShell:

```powershell
$env:MONGODB_URI="<your Atlas connection string>"
$env:MONGODB_DATABASE="simple_bank"
$env:JWT_SECRET="<your Base64 secret>"
$env:JWT_EXPIRATION_MS="3600000"
docker compose up --build
```

Open:

- React application: [http://localhost:3000](http://localhost:3000)
- Spring API: [http://localhost:8080](http://localhost:8080)
- Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

The backend container receives secrets only at runtime. The frontend container contains the built static assets and Nginx configuration, not source, tests, `node_modules`, `MONGODB_URI`, or `JWT_SECRET`. MongoDB is not included in Compose; Atlas remains the persistent store, so data survives container replacement and `docker compose down` / `up` cycles.

## Local Development

Terminal 1, with the backend environment variables already set:

```powershell
.\mvnw.cmd spring-boot:run
```

Terminal 2:

```powershell
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The Vite `/api` proxy forwards to Spring Boot at port 8080.

## Verification

Backend, using the project wrapper:

```powershell
.\mvnw.cmd clean test
```

Frontend:

```powershell
cd frontend
npm run format:check
npm run i18n:check
npm run lint
npm run test
npm run build
```

Container definitions:

```powershell
docker compose config
docker compose build
```

The automated frontend suite mocks API modules and never connects to Atlas. The backend tests mock persistence boundaries and also do not connect to Atlas. Dashboard tests cover all five roles, cross-customer isolation, actor-scoped teller activity, exact monetary aggregates, absent forbidden actions, charts, empty states, and public-home behavior. A live end-to-end and restart-persistence check requires valid local Atlas and JWT environment values.

## UI Screenshots

### Banking experience evidence

Captured from the isolated `simple_bank_demo` dataset after live login and responsive QA. The set covers the public homepage, every role-specific dashboard, the analytical chart, and access governance without exposing credentials or tokens.

| English home | Spanish phone home | French customer phone |
| --- | --- | --- |
| ![English desktop banking homepage](docs/screenshots/banking-experience/01-home-desktop-en.png) | ![Spanish mobile banking homepage](docs/screenshots/banking-experience/02-home-mobile-es.png) | ![French mobile customer dashboard](docs/screenshots/banking-experience/04-customer-dashboard-mobile-fr.png) |

| Customer | Teller | Manager |
| --- | --- | --- |
| ![Customer dashboard](docs/screenshots/banking-experience/03-customer-dashboard.png) | ![Teller dashboard](docs/screenshots/banking-experience/05-teller-dashboard.png) | ![Manager dashboard](docs/screenshots/banking-experience/06-manager-dashboard.png) |

| Auditor | Administrator |
| --- | --- |
| ![Read-only auditor dashboard](docs/screenshots/banking-experience/07-auditor-dashboard.png) | ![Administrator dashboard](docs/screenshots/banking-experience/08-admin-dashboard.png) |

| Manager activity chart | Administrator access overview |
| --- | --- |
| ![Manager 30-day activity chart](docs/screenshots/banking-experience/09-manager-activity-chart.png) | ![Administrator access overview](docs/screenshots/banking-experience/10-admin-access-overview.png) |

Live checks on 2026-09-30 covered 1440, 1280, 1024, 834, 768, 430, 390, and 360 pixels; English, Spanish, and French; all five authenticated roles; and a zero-violation axe scan of the administrator dashboard.

### Earlier workflow evidence

Captured from `http://localhost:3000` against the Dockerized API and Atlas. No tokens or credentials are shown.

| Login | Admin overview | Customer portal |
| --- | --- | --- |
| ![Login](docs/screenshots/01-login.png) | ![Admin overview](docs/screenshots/02-admin-overview.png) | ![Customer portal](docs/screenshots/03-customer-portal.png) |

| Customers | Account | Transfer |
| --- | --- | --- |
| ![Customers](docs/screenshots/04-customers-table.png) | ![Account](docs/screenshots/05-account-details.png) | ![Transfer](docs/screenshots/06-transfer.png) |

| Audit log | Access management | Security audit | Phone |
| --- | --- | --- | --- |
| ![Audit log](docs/screenshots/07-audit-log.png) | ![Access management](docs/screenshots/08-access-management.png) | ![Security audit](docs/screenshots/09-security-audit.png) | ![Customer on a phone](docs/screenshots/10-mobile-customer.png) |

## Product spike evidence

Captured from the isolated `simple_bank_demo` dataset. No passwords, tokens, or the credential file are shown.

| English landing | Spanish landing | French customer phone |
| --- | --- | --- |
| ![English landing](docs/screenshots/product-spike/01-landing-en.png) | ![Spanish landing](docs/screenshots/product-spike/02-landing-es.png) | ![French customer](docs/screenshots/product-spike/03-customer-mobile-fr.png) |

| Admin overview | Customers | Customer account |
| --- | --- | --- |
| ![Admin overview](docs/screenshots/product-spike/04-admin-overview.png) | ![Customers](docs/screenshots/product-spike/05-customers-datatable.png) | ![Customer account](docs/screenshots/product-spike/07-account-details.png) |

| Access management | Security audit | Phone menu |
| --- | --- | --- |
| ![Access management](docs/screenshots/product-spike/08-access-management.png) | ![Security audit](docs/screenshots/product-spike/09-security-audit.png) | ![Phone menu](docs/screenshots/product-spike/10-mobile-menu.png) |

The customer portal screenshot is `docs/screenshots/product-spike/06-customer-portal.png`.

Live checks on 2026-09-30:

- Demo authentication: 20/20, with 1 administrator, 2 managers, 3 tellers, 2 auditors, and 12 customers.
- Dataset `product-spike-v1`: 20 auth users, 12 bank customers, 21 accounts, 78 transactions, 60 banking audits, and 4 security audits.
- Landing had no horizontal overflow at 1440, 1280, 1024, 834, 768, 430, 390, and 360.
- Spanish and French stayed selected after reload, and `document.documentElement.lang` was `es` and `fr`.
- A restart without reset kept those counts. `DEMO_SEED_RESET=true` recreated the same counts, and the compose default was returned to `false`.
- The normal `simple_bank` counts recorded before the demo were unchanged after demo start, restart, and reset: 12 customers, 16 accounts, 38 transactions, 26 banking audits, 17 auth users, and 15 security audits. `ava.admin` was absent from the normal database.

Details are in `docs/demo-spike.md`.

## API Summary

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/verify` |
| Dashboard | `GET /api/dashboard` (authenticated role is derived server-side) |
| Customer portal | `GET /api/me`, `GET /api/me/accounts`, `GET /api/me/accounts/{id}`, `GET /api/me/accounts/{id}/transactions`, `PUT /api/me/profile`, `POST /api/me/transfers/preview`, `POST /api/me/transfers` |
| Customers | `POST/GET /api/users`, `GET /api/users/search?firstName=`, `GET/PUT/DELETE /api/users/{id}`, `GET /api/users/{id}/accounts` |
| Accounts | `POST/GET /api/accounts`, `GET/PUT/DELETE /api/accounts/{id}`, `GET /api/accounts/premium` |
| Money | `POST /api/accounts/{id}/deposit`, `POST /api/accounts/{id}/withdraw`, `POST /api/accounts/transfer` |
| History | `GET /api/accounts/{id}/transactions` |
| Banking audits | `GET /api/audits`, `GET /api/audits/{id}` |
| Admin | `GET /api/admin/whoami`, `GET/PUT /api/admin/auth-users`, customer link, `GET /api/admin/security-audits` |

All protected requests use `Authorization: Bearer <token>`. IDs are strings. Amounts must be at least `0.01` with no more than two decimal places. Customer deletion conflicts while accounts exist; account deletion conflicts while transactions exist. Handled failures return a structured `ErrorResponse` without stack traces.

Customer transfer preview and submit accept `sourceAccountId`, `destinationAccountNumber` (12 digits), and `amount`. The server derives the actor from the token. Staff `POST /api/accounts/transfer` still uses internal `fromAccountId` and `toAccountId`. A customer sees the full number of accounts they own. Another customer's number stays masked in preview, history, and the receipt.

No screenshot or application claim implies a production bank, PCI compliance, SOC 2 compliance, or regulatory certification.
