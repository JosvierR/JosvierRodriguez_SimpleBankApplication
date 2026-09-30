# Simple Bank Application

## Current Phase

Backend REST API with MongoDB Cloud Atlas and JWT authentication

Phase 1 stored customers, accounts, balances, and transactions in `ConcurrentHashMap` while the process was running. The MongoDB branch keeps that API and stores it in Atlas. This branch adds stateless JWT authentication in front of the same banking API.

Bank customers and API logins are different records. A customer in `users` still owns accounts. A login in `auth_users` only proves that the caller may use the API. Registering does not create a customer, and the two ids are not required to match. There is no frontend in this phase.

## Tech Stack

- Java 17
- Spring Boot 4.0.8
- Maven
- Spring Web (MVC)
- Spring Validation
- Spring Data MongoDB
- MongoDB Atlas
- Spring Security
- JWT (JJWT, HMAC SHA-256)
- BCrypt password hashing
- Springdoc OpenAPI 3.0.3 (Swagger UI)
- JUnit 5
- Mockito
- Spring Boot Test (MockMvc)

Spring Boot 4 renamed the classic web starter to `spring-boot-starter-webmvc`. It is still the Spring MVC stack used by this API. MongoDB settings use `spring.mongodb.uri`, not the older `spring.data.mongodb.uri`.

## Architecture

```text
Controller
    ↓
Service
    ↓
Repository Interface
    ↓
Mongo Repository Adapter
    ↓
Spring Data MongoRepository
    ↓
MongoDB Atlas
```

- **Controller** receives the HTTP request, validates the body, calls a service, and returns a status code plus a response DTO. It does not know about MongoDB.
- **Service** owns the banking rules: unique email, existing user, positive amount, sufficient balance, and recording a transaction only after the balance update is accepted.
- **Repository interface** is the storage port. Banking services depend on `UserRepository`, `AccountRepository`, `TransactionRepository`, and `AuditRepository`. Authentication depends on `AuthUserRepository`.
- **Mongo adapter** implements that port. It maps domain objects to documents and back. It does not calculate balances.
- **Spring Data MongoRepository** is the infrastructure that talks to a collection.
- **MongoDB Atlas** is the database. Phase 1's in-memory classes are not on this branch.

Identifiers are MongoDB ObjectId values exposed as strings, for example `68dc1234567890abcdef1234`. Phase 1 used `Long` values from `AtomicLong`. That sequence is gone. MongoDB generates the id.

## Features

- Create users
- List all users
- View one user
- Update users
- Delete users who own no accounts
- Create bank accounts
- List all accounts
- View one account
- Update an account type
- Delete an account that has no transactions
- List accounts by user
- List premium accounts at or above a balance threshold
- Deposit money
- Withdraw money
- Transfer money between two accounts
- View transaction history
- Audit who moved money, when, which accounts, and how much
- Validation
- Exception handling
- MongoDB Atlas persistence
- Data persistence across restarts
- BSON ObjectId identifiers exposed as strings
- Decimal128 money storage
- Unique email index
- MongoDB transactions for deposit, withdraw, and transfer
- Swagger/OpenAPI with a Bearer authorize button
- Postman CRUD, banking, transfer, audit, and JWT flows
- Stateless JWT authentication for `/api/**`
- BCrypt password hashes in a separate `auth_users` collection

## Collections

Database: `simple_bank`

USERS

```text
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "createdAt": Date
}
```

ACCOUNTS

```text
{
  "_id": ObjectId,
  "userId": String,
  "balance": Decimal128,
  "accountType": "SAVINGS" | "CHECKING",
  "createdAt": Date
}
```

TRANSACTIONS

```text
{
  "_id": ObjectId,
  "accountId": String,
  "type": "DEPOSIT" | "WITHDRAW",
  "amount": Decimal128,
  "createdAt": Date
}
```

AUDITS

```text
{
  "_id": ObjectId,
  "action": "DEPOSIT" | "WITHDRAW" | "TRANSFER",
  "userId": String,
  "accountIds": [String],
  "involvedUserIds": [String],
  "amount": Decimal128,
  "transactionIds": [String],
  "createdAt": Date
}
```

An account stores `userId` instead of embedding the user. A transaction stores `accountId` instead of living inside the account document. The service checks that the referenced user or account exists. Transactions stay in their own collection so one account's history does not grow the account document without a limit. This project does not use DBRef.

AUTH_USERS

```text
{
  "_id": ObjectId,
  "username": String,
  "email": String,
  "passwordHash": BCrypt String,
  "roles": ["USER"],
  "enabled": true,
  "createdAt": Date
}
```

`auth_users` is the login collection. `users` is still the bank customer collection. A public registration always stores `USER`. There is no request field that can grant `ADMIN`. The password the client sent is not stored. `passwordHash` is a BCrypt hash.

Indexes, created because `spring.data.mongodb.auto-index-creation=true`:

| Collection | Index | Purpose |
| --- | --- | --- |
| users | `email_unique_idx` unique | One email per customer, including a race between two creates |
| accounts | `user_id_idx` | Lookup by owner |
| transactions | `account_created_at_idx` on `accountId`, `createdAt` | History for one account, oldest first |
| audits | `audit_created_at_idx` on `createdAt` | Traces in the order the movements happened |
| auth_users | `auth_username_unique_idx` unique | One login per username |
| auth_users | `auth_email_unique_idx` unique | One login per email |

Money stays `BigDecimal` in Java. `spring.data.mongodb.representation.big-decimal=decimal128` and the document fields store it as BSON Decimal128. `double` is not used for balances or amounts.

## Project Structure

```text
src/main/java/com/josvier/simplebank/
    SimpleBankApplication.java
    controller/
    dto/request/
    dto/response/
    model/
    repository/
    repository/mongo/document/
    repository/mongo/springdata/
    repository/mongo/adapter/
    service/
    service/impl/
    exception/
    config/
    auth/
    security/
src/test/java/com/josvier/simplebank/
    service/
    controller/
    repository/mongo/
    config/
docs/
    MONGODB_ATLAS_SETUP.md
postman/
    SimpleBank_Backend_API.postman_collection.json
```

## MongoDB Atlas Security

`MONGODB_URI` is a secret. It contains the database username and password. Do not commit it, paste it into the README, or put it in `application.properties`.

`JWT_SECRET` is also a secret. It signs access tokens with HMAC SHA-256, so it must be a Base64-encoded random value of at least 256 bits. It has no default in `application.properties`. Do not commit a real secret, paste one into this README, or put one in Postman or Swagger. `JWT_EXPIRATION_MS` defaults to `3600000` (one hour) when it is omitted.

`.env.example` lists the variable names with placeholders. Spring Boot does not load `.env` or `.env.example`. Export the variables in the shell that runs the application.

The database user is separate from the Atlas website login. Give that user `readWrite` on `simple_bank` only. Add your current IP in the Atlas Network Access list. `0.0.0.0/0` lets any address try the password, so use it only as a short-lived development workaround.

If the password contains `@`, `:`, `/`, `?`, `#`, or `%`, percent-encode those characters in the URI. The Atlas `mongodb+srv` connection uses TLS.

Setup steps are in [docs/MONGODB_ATLAS_SETUP.md](docs/MONGODB_ATLAS_SETUP.md).

## Running the Application

From the project root, with the Atlas variables set.

Windows PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank"
$env:MONGODB_DATABASE="simple_bank"
$env:JWT_SECRET="<base64-encoded-256-bit-secret>"
$env:JWT_EXPIRATION_MS="3600000"
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```text
export MONGODB_URI="mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank"
export MONGODB_DATABASE="simple_bank"
export JWT_SECRET="<base64-encoded-256-bit-secret>"
export JWT_EXPIRATION_MS="3600000"
./mvnw spring-boot:run
```

`MONGODB_DATABASE` defaults to `simple_bank` when it is omitted. `MONGODB_URI` and `JWT_SECRET` have no default. The application does not start without them.

The API listens on `http://localhost:8080/api`.

Swagger UI is at [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). The OpenAPI document is at `http://localhost:8080/v3/api-docs`. Swagger itself is public. Use **Authorize** and paste the access token from login. Swagger sends `Authorization: Bearer <token>` on the protected operations. Register and login stay public in the document.

From the UI, register or log in, authorize, create a bank customer, copy the returned string id into **Open an account**, then deposit, withdraw, and read history with that account id.

`GET /api` by itself is not an operation. An unknown path returns 404.

Data remains in Atlas when the application stops.

## Running Tests

Windows:

```text
mvnw.cmd test
```

macOS/Linux:

```text
./mvnw test
```

The automated tests mock the repositories and the Spring Data interfaces. They do not connect to Atlas and they do not prove that a failed second write rolls back. Rollback requires a real Atlas replica-set transaction.

## API Endpoints

| Method | Path | Success | Purpose |
| --- | --- | --- | --- |
| POST | /api/auth/register | 201 | Public. Create an API login with role USER and return a bearer token |
| POST | /api/auth/login | 200 | Public. Check the password and return a bearer token |
| GET | /api/auth/verify | 200 | Confirm the bearer token and return the username and roles |
| POST | /api/users | 201 | Create a user |
| GET | /api/users | 200 | List every user |
| GET | /api/users/{id} | 200 | View a user |
| PUT | /api/users/{id} | 200 | Update a user's name and email. The id and createdAt stay the same |
| DELETE | /api/users/{id} | 204 | Delete a user who owns no accounts |
| POST | /api/accounts | 201 | Open an account with balance 0.00 |
| GET | /api/accounts | 200 | List every account |
| GET | /api/accounts/{id} | 200 | View an account |
| PUT | /api/accounts/{id} | 200 | Update the account type. The id, owner, balance, and createdAt stay the same |
| DELETE | /api/accounts/{id} | 204 | Delete an account that has no transactions |
| GET | /api/accounts/premium?threshold= | 200 | Accounts whose balance is greater than or equal to the threshold |
| GET | /api/users/{userId}/accounts | 200 | List accounts owned by one user. An existing user with none returns `[]` |
| POST | /api/accounts/{id}/deposit | 200 | Deposit a positive amount |
| POST | /api/accounts/{id}/withdraw | 200 | Withdraw a positive amount that the balance can cover |
| POST | /api/accounts/transfer | 200 | Move money from one account to another |
| GET | /api/accounts/{id}/transactions | 200 | View transaction history, oldest first |
| GET | /api/audits | 200 | List compliance traces, oldest first |
| GET | /api/audits/{id} | 200 | View who, when, which accounts, and how much |

`{id}` and `{userId}` are string ObjectId values, not numbers.

`POST /api/auth/register` and `POST /api/auth/login` are public. Swagger UI and `/v3/api-docs` are public. Every other `/api/**` route requires a bearer token:

```text
Authorization: Bearer <token>
```

The token expires after `JWT_EXPIRATION_MS` milliseconds. The login response field `expiresIn` is that duration in seconds. A missing token, a bad signature, or an expired token returns 401 JSON. It does not return HTML or the JWT library's exception text. Normal banking does not require `ADMIN`. Registration cannot ask for `ADMIN`.

A duplicate username or email on register returns 409. A wrong password returns 401 with `Invalid username or password`. A password shorter than 8 characters returns 400.

A user who still owns one or more accounts cannot be deleted. `DELETE /api/users/{id}` then returns 409 with the message `User cannot be deleted while accounts still exist`. The user and those accounts stay in the database. This keeps `Account.userId` from pointing at a customer who is gone.

An account that already has transactions cannot be deleted. `DELETE /api/accounts/{id}` then returns 409 with the message `Account cannot be deleted while transactions still exist`. The audit trace for that history stays as well.

A transfer debits the source account, credits the destination account, writes one withdrawal and one deposit in the ledger, and writes one audit row that names both accounts. The source and destination must be different accounts, and the source balance must cover the amount.

Common error responses:

| Situation | Status |
| --- | --- |
| Invalid body, non-positive amount, more than 2 decimal places, or insufficient funds | 400 |
| Missing, invalid, or expired bearer token, or wrong login password | 401 |
| Unknown user, unknown account, or unknown route | 404 |
| Email already registered, deleting a user who still owns accounts, or deleting an account that still has transactions | 409 |

Error bodies use `ErrorResponse` and do not include a stack trace, a host name, or the connection URI.

## Example Workflow

1. Register with `POST /api/auth/register`, or log in with `POST /api/auth/login`.
2. Send `Authorization: Bearer <token>` on the banking calls below.
3. Create a bank customer with `POST /api/users`.
4. Create an account for that string `userId` with `POST /api/accounts`. The balance starts at `0.00`.
5. Deposit with `POST /api/accounts/{id}/deposit`.
6. Withdraw with `POST /api/accounts/{id}/withdraw`.
7. Read history with `GET /api/accounts/{id}/transactions`.

A failed withdrawal, such as asking for more money than the balance, returns 400. The balance stays the same and no transaction is added.

Deposit and withdrawal each run inside one MongoDB transaction: the balance update and the history insert commit together or roll back together. The service also keeps a per-account lock in this process so two threads in the same JVM do not apply the same balance at once. That lock does not coordinate a second running instance. The database transaction is the durable boundary.

The Postman collection in `postman/` follows this flow. Import it and run the **JWT Authentication** folder first so `jwtToken` is saved. Banking requests then send `Authorization: Bearer {{jwtToken}}`. Register and login do not send that header. Create User generates a new email on each run and saves `userId`. Create Account sends that id as a JSON string and saves `accountId`. A later request reuses the same email and expects 409. The **JWT Banking Demo** folder registers, logs in, creates a customer and an account, deposits 500, withdraws 200, and reads history and audits. One request calls `GET /api/accounts` with no token and expects 401.

The **Customer CRUD Demo** folder creates three customers with unique emails, lists them, updates one, rejects a duplicate email, deletes a customer who has no accounts, and refuses to delete a customer who owns an account. List checks look for those new ids inside the response. They do not require the database to contain only those three records.

## Class CRUD Requirements

| Class requirement | Endpoint |
| --- | --- |
| Create customer | POST /api/users |
| GetAll / findAll | GET /api/users |
| GetById / findById | GET /api/users/{id} |
| Post | POST /api/users |
| Update | PUT /api/users/{id} |
| Delete | DELETE /api/users/{id} |
| Fetch accounts | GET /api/accounts |
| User's accounts | GET /api/users/{userId}/accounts |
| Update account | PUT /api/accounts/{id} |
| Delete account | DELETE /api/accounts/{id} |
| Premium accounts | GET /api/accounts/premium?threshold= |
| Transfer | POST /api/accounts/transfer |
| Audit trace | GET /api/audits and GET /api/audits/{id} |

## Banking rules that did not change

Deposit and withdrawal amounts must be at least `0.01` and may have at most two decimal places. `10.12`, `10`, and `0.01` are accepted. `10.126`, `0`, and `-10` return `400`. The API rejects extra precision instead of rounding it.

The service still rejects a duplicate email with HTTP 409 before it saves. The unique index on `users.email` is the extra guarantee when two requests pass that check at the same time.
