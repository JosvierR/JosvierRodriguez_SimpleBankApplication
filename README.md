# Simple Bank Application

Simple Bank is an educational full-stack banking operations application. The current phase combines a React dashboard, a secured Spring Boot API, MongoDB Atlas persistence, JWT authentication, and Docker packaging.

## Current Phase

**Full-stack React + Spring Boot + MongoDB Atlas + JWT**

The project evolved in four focused phases:

1. Phase 1 — in-memory customers, accounts, balances, and transactions.
2. Phase 2 — MongoDB Atlas persistence with ObjectId identifiers, Decimal128 money, indexes, and transactional money movement.
3. Phase 3 — stateless JWT authentication, BCrypt credentials, roles, and authenticated audit actors.
4. Phase 4 — React operations UI, real API integration, responsive UX, automated frontend tests, and full-stack Docker support.

Bank customers and API logins remain intentionally separate. A record in `users` owns bank accounts. A record in `auth_users` proves that a person may access the API. Registration creates an API login; it does not create a bank customer.

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

The authenticated operations shell provides:

- A dashboard calculated from real customers, accounts, balances, and audits
- Searchable customer management with update and guarded deletion
- Customer details with all owned accounts
- One account-opening workflow for either a new or existing customer
- Explicit recovery when a customer succeeds but account creation fails
- Account search, type filters, and a backend-powered premium threshold
- Account details, account-type updates, and guarded deletion
- Deposit, withdrawal, transaction history, and account-to-account transfer
- Compliance audits distinguishing the bank customer from the authenticated actor
- An ADMIN-only identity verification page, with both frontend and backend enforcement
- Loading skeletons, empty states, calm errors, accessible notifications, and confirmation dialogs
- Desktop operations shell, tablet layouts, and a mobile navigation drawer

All balances, customers, accounts, transactions, and audits come from the Spring API. Production components contain no demo financial data.

## Authentication and Authorization

Public routes:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `/login`
- `/register`

The browser stores only the returned token in `sessionStorage`. It never uses `localStorage`, displays the token, or decodes JWT claims as its authorization source. On reload, `GET /api/auth/verify` restores the username and roles from the backend. Any authenticated request that returns `401` clears the token and returns the user to login.

Public registration always receives `USER`; there is no role selector and no built-in admin password. `/admin` is shown only for a verified `ADMIN` role, and `GET /api/admin/whoami` enforces that role again on the backend.

Passwords must contain at least 8 characters and no more than 72 UTF-8 bytes. Register and login responses use `Cache-Control: no-store`. `JWT_SECRET` must decode from Base64 to at least 256 bits and has no application default.

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

Backend:

```powershell
mvn clean test
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

## API Summary

| Area | Endpoints |
| --- | --- |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/verify` |
| Customers | `POST/GET /api/users`, `GET/PUT/DELETE /api/users/{id}`, `GET /api/users/{id}/accounts` |
| Accounts | `POST/GET /api/accounts`, `GET/PUT/DELETE /api/accounts/{id}`, `GET /api/accounts/premium` |
| Money | `POST /api/accounts/{id}/deposit`, `POST /api/accounts/{id}/withdraw`, `POST /api/accounts/transfer` |
| History | `GET /api/accounts/{id}/transactions` |
| Audits | `GET /api/audits`, `GET /api/audits/{id}` |
| Admin | `GET /api/admin/whoami` |

All protected requests use `Authorization: Bearer <token>`. IDs are strings. Amounts must be at least `0.01` with no more than two decimal places. Customer deletion conflicts while accounts exist; account deletion conflicts while transactions exist. Handled failures return a structured `ErrorResponse` without stack traces.

## Screenshot Checklist

For assignment evidence, capture these screens with real Atlas data after completing the live flow:

- Login
- Dashboard
- Create Account
- Account Details with a nonzero balance
- Deposit
- Withdraw
- Transaction History

No screenshots or application claims should imply a production bank, PCI compliance, SOC 2 compliance, or regulatory certification. This remains an educational banking application.
