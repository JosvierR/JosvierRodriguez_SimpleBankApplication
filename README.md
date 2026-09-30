# Simple Bank Application

Simple Bank is an educational full-stack banking application. The product-experience spike adds a public landing page, a calmer interface, English, Spanish, and French, and an isolated twenty-user demo dataset. Role-based authorization and customer ownership stay in place.

## Current Phase

**Product experience: public landing, responsive workspace, localization, and an isolated demo**

The project evolved in six focused phases:

1. Phase 1 — in-memory customers, accounts, balances, and transactions.
2. Phase 2 — MongoDB Atlas persistence with ObjectId identifiers, Decimal128 money, indexes, and transactional money movement.
3. Phase 3 — stateless JWT authentication, BCrypt credentials, and authenticated audit actors.
4. Phase 4 — React operations UI, real API integration, and full-stack Docker support.
5. Phase 5 — CUSTOMER, TELLER, MANAGER, AUDITOR, and ADMIN permissions, customer-owned data, security audit, and role-specific workspaces.
6. Phase 6 — public landing at `/`, authenticated product under `/app`, adaptive tables, and en/es/fr.

`docs/demo-credentials.txt` contains intentionally public synthetic credentials. Never reuse them. They are valid only in the isolated `simple_bank_demo` dataset. See `docs/demo-spike.md`.

The interface follows Apple Human Interface Guidelines as design principles, not as a copy of Apple. Color uses Radix Colors through semantic tokens. Interaction uses Radix primitives. Dense operational tables use TanStack Table. Styling is custom CSS. This project is not affiliated with Apple.

Language preference is stored in `localStorage` under `simple-bank-language`. The access token stays in `sessionStorage`. The selector offers English, Español, and Français. The browser language is used when no preference is saved, and English is the fallback. Logout does not clear the language.

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

Bank customers and API logins stay separate. A record in `users` owns bank accounts. A record in `auth_users` proves that a person may call the API. Registration creates a Customer login. It does not create a bank customer, and it does not grant staff or admin authority.

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

The React application calls relative `/api` URLs. Vite proxies those calls to `localhost:8080` during development; Nginx proxies them to the `backend` service over Docker's internal network in containers. No permissive Spring CORS configuration is required.

## Technology

Frontend:

- React 19, TypeScript, Vite, and React Router
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

Each verified role sees only its own navigation. Inaccessible areas are hidden, and the API still enforces the same limits.

- Customer: Overview, My Accounts, Transfer, and Profile, using `/api/me` only
- Teller: customers, accounts, deposits, and withdrawals
- Manager: teller work, plus transfers, customer and account changes, and the banking audit
- Auditor: read-only customers, accounts, histories, and the banking audit
- Admin: operational banking, Access management, and Security audit

The visual system uses system typography, a light split-view navigation, a restrained blue accent, low-shadow grouped surfaces, and Radix accessibility primitives. The layout is responsive on desktop and in a mobile navigation sheet. This is Apple-like restraint. It is not affiliated with Apple.

Balances, customers, accounts, transactions, and audits come from the Spring API. Production components contain no demo financial data.

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
- **Dashboard** — view the real customer count, account count, total balance, recent-operation count, quick actions, and latest audits.
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
| Home Page | Dashboard at `/` |
| Create Account | `CreateAccountPage` at `/accounts/new` |
| Account Details | `AccountDetailsPage` at `/accounts/:accountId` |
| Deposit | `DepositPage` at `/accounts/:accountId/deposit` |
| Withdraw | `WithdrawPage` at `/accounts/:accountId/withdraw` |
| Transaction History | `TransactionHistoryPage` at `/accounts/:accountId/transactions` |

Additional routes are `/customers`, `/customers/:userId`, `/accounts`, `/transfer`, `/audits`, and role-protected `/admin`.

## Project Structure

```text
frontend/
  public/
  src/
    api/           centralized typed request client and endpoint modules
    auth/          session state, verify, login, register, and logout
    components/    application shell, states, dialogs, and notifications
    pages/         route-level banking workflows
    routes/        protected and admin guards
    styles/        tokens, global rules, and responsive components
    types/         backend API contracts
    utils/         currency, date, amount, and error helpers
  Dockerfile
  nginx.conf
src/main/java/com/josvier/simplebank/
  auth/
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
npm run lint
npm run test
npm run build
```

Container definitions:

```powershell
docker compose config
docker compose build
```

The automated frontend suite mocks API modules and never connects to Atlas. The backend tests mock persistence boundaries and also do not connect to Atlas. A live end-to-end and restart-persistence check requires valid local Atlas and JWT environment values.

## UI Screenshots

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

## API Summary

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/verify` |
| Customer portal | `GET /api/me`, `GET /api/me/accounts`, `GET /api/me/accounts/{id}`, `GET /api/me/accounts/{id}/transactions`, `PUT /api/me/profile`, `POST /api/me/transfers` |
| Customers | `POST/GET /api/users`, `GET/PUT/DELETE /api/users/{id}`, `GET /api/users/{id}/accounts` |
| Accounts | `POST/GET /api/accounts`, `GET/PUT/DELETE /api/accounts/{id}`, `GET /api/accounts/premium` |
| Money | `POST /api/accounts/{id}/deposit`, `POST /api/accounts/{id}/withdraw`, `POST /api/accounts/transfer` |
| History | `GET /api/accounts/{id}/transactions` |
| Banking audits | `GET /api/audits`, `GET /api/audits/{id}` |
| Admin | `GET /api/admin/whoami`, `GET/PUT /api/admin/auth-users`, customer link, `GET /api/admin/security-audits` |

All protected requests use `Authorization: Bearer <token>`. IDs are strings. Amounts must be at least `0.01` with no more than two decimal places. Customer deletion conflicts while accounts exist; account deletion conflicts while transactions exist. Handled failures return a structured `ErrorResponse` without stack traces.

No screenshot or application claim implies a production bank, PCI compliance, SOC 2 compliance, or regulatory certification.
