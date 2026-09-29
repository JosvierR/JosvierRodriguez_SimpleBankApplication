# Simple Bank Application

## Current Phase

Backend REST API with MongoDB Cloud Atlas

Phase 1 stored customers, accounts, balances, and transactions in `ConcurrentHashMap` while the process was running. This branch keeps that API and replaces the storage. Data now lives in MongoDB Atlas and is still there after the application stops and starts again.

There is no authentication and no frontend in this phase.

## Tech Stack

- Java 17
- Spring Boot 4.0.8
- Maven
- Spring Web (MVC)
- Spring Validation
- Spring Data MongoDB
- MongoDB Atlas
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
- **Repository interface** is the storage port. Services depend on `UserRepository`, `AccountRepository`, and `TransactionRepository`.
- **Mongo adapter** implements that port. It maps domain objects to documents and back. It does not calculate balances.
- **Spring Data MongoRepository** is the infrastructure that talks to a collection.
- **MongoDB Atlas** is the database. Phase 1's in-memory classes are not on this branch.

Identifiers are MongoDB ObjectId values exposed as strings, for example `68dc1234567890abcdef1234`. Phase 1 used `Long` values from `AtomicLong`. That sequence is gone. MongoDB generates the id.

## Features

- Create users
- Create accounts
- View accounts
- Deposit money
- Withdraw money
- View transaction history
- Validation
- Exception handling
- Persistent storage across restarts
- Unique email at the service and at the database index
- Deposit and withdrawal atomicity through a MongoDB transaction

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

An account stores `userId` instead of embedding the user. A transaction stores `accountId` instead of living inside the account document. The service checks that the referenced user or account exists. Transactions stay in their own collection so one account's history does not grow the account document without a limit. This project does not use DBRef.

Indexes, created because `spring.data.mongodb.auto-index-creation=true`:

| Collection | Index | Purpose |
| --- | --- | --- |
| users | `email_unique_idx` unique | One email per customer, including a race between two creates |
| accounts | `user_id_idx` | Lookup by owner |
| transactions | `account_created_at_idx` on `accountId`, `createdAt` | History for one account, oldest first |

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
.\mvnw.cmd spring-boot:run
```

macOS/Linux:

```text
export MONGODB_URI="mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank"
export MONGODB_DATABASE="simple_bank"
./mvnw spring-boot:run
```

`MONGODB_DATABASE` defaults to `simple_bank` when it is omitted. `MONGODB_URI` has no default.

The API listens on `http://localhost:8080/api`.

Swagger UI is at [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html). The OpenAPI document is at `http://localhost:8080/v3/api-docs`. From the UI, use **Try it out** on each operation. Create a user first, copy the returned string id into **Open an account**, then deposit, withdraw, and read history with that account id.

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
| POST | /api/users | 201 | Create a user |
| GET | /api/users | 200 | List every user |
| GET | /api/users/{id} | 200 | View a user |
| PUT | /api/users/{id} | 200 | Update a user's name and email. The id and createdAt stay the same |
| DELETE | /api/users/{id} | 204 | Delete a user who owns no accounts |
| POST | /api/accounts | 201 | Open an account with balance 0.00 |
| GET | /api/accounts | 200 | List every account |
| GET | /api/accounts/{id} | 200 | View an account |
| GET | /api/users/{userId}/accounts | 200 | List accounts owned by one user. An existing user with none returns `[]` |
| POST | /api/accounts/{id}/deposit | 200 | Deposit a positive amount |
| POST | /api/accounts/{id}/withdraw | 200 | Withdraw a positive amount that the balance can cover |
| GET | /api/accounts/{id}/transactions | 200 | View transaction history, oldest first |

`{id}` and `{userId}` are string ObjectId values, not numbers.

A user who still owns one or more accounts cannot be deleted. `DELETE /api/users/{id}` then returns 409 with the message `User cannot be deleted while accounts still exist`. The user and those accounts stay in the database. This keeps `Account.userId` from pointing at a customer who is gone.

Common error responses:

| Situation | Status |
| --- | --- |
| Invalid body, non-positive amount, more than 2 decimal places, or insufficient funds | 400 |
| Unknown user, unknown account, or unknown route | 404 |
| Email already registered, or deleting a user who still owns accounts | 409 |

Error bodies use `ErrorResponse` and do not include a stack trace, a host name, or the connection URI.

## Example Workflow

1. Create a user with `POST /api/users`.
2. Create an account for that string `userId` with `POST /api/accounts`. The balance starts at `0.00`.
3. Deposit with `POST /api/accounts/{id}/deposit`.
4. Withdraw with `POST /api/accounts/{id}/withdraw`.
5. Read history with `GET /api/accounts/{id}/transactions`.

A failed withdrawal, such as asking for more money than the balance, returns 400. The balance stays the same and no transaction is added.

Deposit and withdrawal each run inside one MongoDB transaction: the balance update and the history insert commit together or roll back together. The service also keeps a per-account lock in this process so two threads in the same JVM do not apply the same balance at once. That lock does not coordinate a second running instance. The database transaction is the durable boundary.

The Postman collection in `postman/` follows this flow. Import it and run the folders from top to bottom. Requests use the `baseUrl` variable (`http://localhost:8080/api`). Create User generates a new email on each run and saves `userId`. Create Account sends that id as a JSON string and saves `accountId`. A later request reuses the same email and expects 409.

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

## Banking rules that did not change

Deposit and withdrawal amounts must be at least `0.01` and may have at most two decimal places. `10.12`, `10`, and `0.01` are accepted. `10.126`, `0`, and `-10` return `400`. The API rejects extra precision instead of rounding it.

The service still rejects a duplicate email with HTTP 409 before it saves. The unique index on `users.email` is the extra guarantee when two requests pass that check at the same time.
