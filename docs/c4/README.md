# C4 diagrams for Simple Bank

These pages explain the program at four zoom levels. Start here, then open the page that matches the question you have.

C4 is a way to draw the same system four times, each time closer:

| Level | Question it answers | Page |
| --- | --- | --- |
| Context | Who uses Simple Bank, and what sits outside it? | [01 System context](01-system-context.md) |
| Container | Which programs actually run, and how do they talk? | [02 Containers](02-containers.md) |
| Component | What are the major parts inside the API and inside React? | [03 Backend](03-backend-components.md), [04 Frontend](04-frontend-components.md) |
| Code | Which classes run for one important request? | Search path in [06 Banking ledger](06-banking-ledger.md) |

The other pages are flows that cut across those levels:

| Flow | Page |
| --- | --- |
| Register, login, JWT, roles, reserved username `admin` | [05 Security and identity](05-security-and-identity.md) |
| Customers, accounts, money, search, premium filter | [06 Banking ledger](06-banking-ledger.md) |
| Staff lookup versus the customer portal | [07 Customer and staff access](07-customer-and-staff-access.md) |
| Dashboards, languages, demo data, Docker | [08 Dashboards, i18n, demo, and Docker](08-dashboards-i18n-demo-docker.md) |

The shorter layer picture already lives in [system architecture](../system-architecture.md). Dashboard field lists live in [dashboard design](../dashboard-design.md). Classroom mapping lives in [trainer requirements](../trainer-requirements.md). This folder does not replace those pages.

## Words used on every page

REST means the API is a set of resources and HTTP verbs. A customer is `/api/users/{id}`. Create is POST, read is GET, update is PUT, delete is DELETE.

A controller is the HTTP edge. A service is the use case. A repository is the boundary in front of the database. The controller does not query MongoDB.

JWT is a signed access token. BCrypt is a one-way password hash. RBAC means role-based access control: CUSTOMER, TELLER, MANAGER, AUDITOR, and ADMIN.

401 means the caller is not authenticated. 403 means the caller is authenticated and is not allowed. 404 means the resource is missing, or is hidden because it belongs to someone else. 409 means the request conflicts with a rule, such as a reserved username or the last administrator.

IDOR means insecure direct object reference: changing an id in the URL to open someone else's record. This API prevents that for customers by looking up the account together with the owner's id, and by answering 404.

i18n means the interface is translated. The languages are English, Spanish, and French.

Decimal128 is MongoDB's exact decimal type. Java uses `BigDecimal` for the same reason: money is not a binary floating-point number.
