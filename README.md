# Simple Bank Application

## Current Phase

Backend REST API Without Database

This branch builds the first version of the bank API. Customers, accounts, balances, and transactions are stored in memory while the application is running. There is no authentication and no frontend in this phase.

## Tech Stack

- Java 17
- Spring Boot 4.0.8
- Maven
- Spring Web (MVC)
- Spring Validation
- JUnit 5
- Mockito
- Spring Boot Test (MockMvc)

Spring Boot 4 renamed the classic web starter to `spring-boot-starter-webmvc`. It is still the Spring MVC stack used by this API. `spring-boot-starter-webmvc-test` provides MockMvc.

## Architecture

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
In-Memory Storage
```

- **Controller** receives the HTTP request, validates the body, calls a service, and returns a status code plus a response DTO.
- **Service** owns the banking rules: unique email, existing user, positive amount, sufficient balance, and recording a transaction only after the balance update is accepted.
- **Repository** is an interface for storing and loading domain objects. The service does not know whether the data lives in a map or in a database.
- **In-memory storage** is the current repository implementation. It uses `ConcurrentHashMap` for the records and `AtomicLong` for ids.

## Features

- Create users
- Create accounts
- View accounts
- Deposit money
- Withdraw money
- View transaction history
- Validation
- Exception handling

## Project Structure

```text
src/main/java/com/josvier/simplebank/
    SimpleBankApplication.java
    controller/
    dto/request/
    dto/response/
    model/
    repository/
    repository/memory/
    service/
    service/impl/
    exception/
src/test/java/com/josvier/simplebank/
    service/
    controller/
postman/
    SimpleBank_Backend_API.postman_collection.json
```

## Running the Application

From the project root.

Windows:

```text
mvnw.cmd spring-boot:run
```

macOS/Linux:

```text
./mvnw spring-boot:run
```

The API listens on `http://localhost:8080/api`.

Data is wiped when the application stops.

## Running Tests

Windows:

```text
mvnw.cmd test
```

macOS/Linux:

```text
./mvnw test
```

## API Endpoints

| Method | Path | Success | Purpose |
| --- | --- | --- | --- |
| POST | /api/users | 201 | Create a user |
| GET | /api/users/{id} | 200 | View a user |
| POST | /api/accounts | 201 | Open an account with balance 0.00 |
| GET | /api/accounts/{id} | 200 | View an account |
| POST | /api/accounts/{id}/deposit | 200 | Deposit a positive amount |
| POST | /api/accounts/{id}/withdraw | 200 | Withdraw a positive amount that the balance can cover |
| GET | /api/accounts/{id}/transactions | 200 | View transaction history, oldest first |

Common error responses:

| Situation | Status |
| --- | --- |
| Invalid body, non-positive amount, or insufficient funds | 400 |
| Unknown user or account | 404 |
| Email already registered | 409 |

Error bodies use `ErrorResponse` and do not include a stack trace.

## Example Workflow

1. Create a user with `POST /api/users`.
2. Create an account for that user with `POST /api/accounts`. The balance starts at `0.00`.
3. Deposit with `POST /api/accounts/{id}/deposit`.
4. Withdraw with `POST /api/accounts/{id}/withdraw`.
5. Read history with `GET /api/accounts/{id}/transactions`.

A failed withdrawal, such as asking for more money than the balance, returns 400. The balance stays the same and no transaction is added.

The Postman collection in `postman/` follows this flow. Import it and run the folders from top to bottom against a freshly started application. Requests use the `baseUrl` variable (`http://localhost:8080/api`). The create requests save `userId` and `accountId` for the later calls.

## Important Note

This branch intentionally uses in-memory repositories and has no database.

`InMemoryAccountRepository`, `InMemoryUserRepository`, and `InMemoryTransactionRepository` implement the repository interfaces. A future branch can replace those classes with Spring Data JPA repositories backed by MySQL. The controllers, and most of the service logic, can stay as they are because they depend on the interfaces rather than on the map-based classes.
