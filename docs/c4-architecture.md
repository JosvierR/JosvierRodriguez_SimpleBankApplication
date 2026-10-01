# C4 architecture

This document describes the educational Simple Bank application using the C4 model. Diagrams are Mermaid and render on GitHub.

The system is a role-aware banking demo. It is not a production bank and does not claim regulatory compliance.

## C4 Level 1 — System context

People use one application. MongoDB Atlas stores durable data. The browser is the delivery device, not a separate business system.

| Person | What they do |
| --- | --- |
| Customer | Views owned accounts and history, and sends an internal transfer from an owned account |
| Teller | Serves customers with deposits, withdrawals, and account opening. Cannot transfer |
| Manager | Operates the branch, including transfers between accounts by internal id, and reads banking audits |
| Auditor | Reads customers, accounts, history, premium accounts, and banking audits. Cannot change money |
| Administrator | Manages login identities, roles, customer links, and security audits |

The system boundary is the Simple Bank Application: the React client plus the Spring Boot API. Atlas is outside that boundary.

```mermaid
C4Context
  title C4 Level 1 — System context
  Person(customer, "Customer", "Owns accounts and sends internal transfers")
  Person(teller, "Teller", "Opens accounts and posts cash movements")
  Person(manager, "Manager", "Runs branch operations and transfers")
  Person(auditor, "Auditor", "Reviews activity and audits")
  Person(admin, "Administrator", "Manages identities and roles")
  System(bank, "Simple Bank Application", "Role-aware educational banking")
  System_Ext(atlas, "MongoDB Atlas", "Accounts, movements, audits, identities")
  System_Ext(browser, "Web browser", "Delivers the interface")
  Rel(customer, browser, "Uses")
  Rel(teller, browser, "Uses")
  Rel(manager, browser, "Uses")
  Rel(auditor, browser, "Uses")
  Rel(admin, browser, "Uses")
  Rel(browser, bank, "HTTPS")
  Rel(bank, atlas, "Reads and writes")
```

## C4 Level 2 — Containers

The browser loads the React application. In Docker, Nginx serves the built files and proxies `/api/` to Spring Boot. In local development, Vite serves the frontend and proxies `/api`. Spring Boot is the only component that talks to MongoDB.

The access token lives in `sessionStorage` under `simple-bank-access-token`. Language preference lives in `localStorage` and is independent of the token. English, Spanish, and French catalogs ship with the frontend. The API does not translate its error messages.

Normal mode uses the configured application database. Demo mode uses the `demo` Spring profile and the isolated `simple_bank_demo` database. Demo seeding refuses any other database name.

```mermaid
C4Container
  title C4 Level 2 — Containers
  Person(user, "Bank user", "Customer, teller, manager, auditor, or administrator")
  Container(frontend, "React frontend", "React, Vite", "Role-specific screens and i18n catalogs")
  Container(edge, "Nginx or Vite", "Static delivery", "Serves the UI and proxies /api")
  Container(api, "Spring Boot API", "Java 17", "Authentication, authorization, banking commands")
  ContainerDb(atlas, "MongoDB Atlas", "Document database", "Normal or demo database")
  Rel(user, edge, "Opens the app")
  Rel(edge, frontend, "Delivers")
  Rel(frontend, api, "JSON /api with bearer token", "HTTPS")
  Rel(api, atlas, "Repositories")
```

## C4 Level 3 — Backend components

Spring Security authenticates the request. The JWT filter is constructed inside the security filter chain and reloads the auth user. Controllers do not read MongoDB directly. They call services. Services call repository ports. Mongo adapters implement those ports.

Role is decided by `RolePermissions` and enforced by `BankAuthorizationService.require`. Ownership of a customer resource is decided in the account and user services with `findByIdAndUserId`. A hidden foreign resource becomes `ResourceNotFoundException` (404). A role that lacks the action becomes `AccessDeniedException` (403).

Money movement that must stay consistent uses a Mongo transaction on the service method: debit, credit, history, and audit commit together or roll back together. Customer internal transfers do this in `submitCustomerTransfer`. Audit rows are written by the audit repository from the account service, not from the controller.

```mermaid
C4Component
  title C4 Level 3 — Backend components
  Container_Boundary(api, "Spring Boot API") {
    Component(filter, "JWT filter", "Security", "Reloads the auth user")
    Component(controllers, "Controllers", "MVC", "Customer portal, accounts, users, admin, dashboard")
    Component(authz, "Authorization service", "RBAC", "Role permission and ownership hide")
    Component(accounts, "Account service", "Banking", "Balances, preview, transfer")
    Component(dashboard, "Dashboard service", "Read model", "Role-specific summaries")
    Component(audits, "Audit services", "Trace", "Banking audits and security audits")
    Component(repos, "Repository ports", "Persistence", "Accounts, transactions, audits, users")
    Component(demo, "Demo seeder", "demo profile", "Seeds simple_bank_demo only")
  }
  ContainerDb(atlas, "MongoDB Atlas", "Database", "Collections")
  Rel(filter, controllers, "Authenticated actor")
  Rel(controllers, authz, "Permission checks")
  Rel(controllers, accounts, "Commands")
  Rel(controllers, dashboard, "Summaries")
  Rel(accounts, repos, "Ports")
  Rel(dashboard, repos, "Ports")
  Rel(accounts, audits, "Successful movements")
  Rel(repos, atlas, "Adapters")
  Rel(demo, repos, "Seed")
```

## C4 Level 3 — Frontend components

The router and providers wrap authentication, language, and toasts. Protected routes read the verified role from `GET /api/auth/verify`. The client does not decode the JWT to decide a role.

The dashboard feature renders a different view per primary role. The customer portal owns accounts, history, and the transfer preview flow. Shared layout components keep tables and cards responsive. The API client attaches the session token and never sends a role in the body.

```mermaid
C4Component
  title C4 Level 3 — Frontend components
  Container_Boundary(ui, "React frontend") {
    Component(router, "App router", "React Router", "Public and protected routes")
    Component(auth, "Auth provider", "Session", "Verify, login, logout")
    Component(i18n, "i18n", "en es fr", "Catalogs and locale formatting")
    Component(client, "API client", "fetch", "Bearer token, error mapping")
    Component(dashboard, "Dashboard feature", "Role views", "Customer, teller, manager, auditor, admin")
    Component(portal, "Customer portal", "Owned data", "Accounts and history")
    Component(transfer, "Transfer feature", "Preview then confirm", "Own account or public account number")
    Component(access, "Access management", "Admin", "Roles, links, security audits")
    Component(layout, "Shared layout", "UI", "Shell, tables, cards, dialogs")
  }
  Rel(router, auth, "Guards")
  Rel(dashboard, client, "GET dashboard")
  Rel(portal, client, "GET /api/me")
  Rel(transfer, client, "POST preview and submit")
  Rel(access, client, "Admin APIs")
  Rel(layout, i18n, "Labels")
```

## C4 Level 4 — Internal transfer code

A customer transfer is a command, not a read of someone else's account. Source lookup requires the authenticated customer's bank user id. Destination lookup uses only the public account number inside preview and submit.

```mermaid
flowchart TD
  ui["CustomerTransferPage"] --> preview["POST /api/me/transfers/preview"]
  ui --> submit["POST /api/me/transfers"]
  preview --> service["AccountServiceImpl"]
  submit --> service
  service --> own["findByIdAndUserId"]
  service --> dest["findByAccountNumber"]
  submit --> tx["Mongo transaction"]
  tx --> debit["Debit source TRANSFER_OUT"]
  tx --> credit["Credit destination TRANSFER_IN"]
  tx --> audit["AuditAction.TRANSFER"]
```

See [transfer-flow.md](transfer-flow.md) for the sequence, privacy choice, and validation rules.
