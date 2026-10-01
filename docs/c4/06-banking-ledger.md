# 06. Banking ledger

This page is the money and customer data. Amounts are `BigDecimal` in Java and Decimal128 in MongoDB, with two decimal places.

```mermaid
flowchart TD
    staff[Staff or admin token]
    users[UserController]
    accounts[AccountController]
    service[AccountServiceImpl]
    mongo[(accounts and transactions)]

    staff --> users
    staff --> accounts
    users --> service
    accounts --> service
    service -->|deposit withdraw transfer| mongo
```

## What this shows

Customer records and account records enter through controllers. Balance changes happen in `AccountServiceImpl`, inside a MongoDB transaction.

## How it works

Customer CRUD, all under `/api/users`:

| Action | Method and path | Who |
| --- | --- | --- |
| Create | `POST /api/users` | TELLER, MANAGER, ADMIN |
| List | `GET /api/users` | TELLER, MANAGER, AUDITOR, ADMIN |
| Read one | `GET /api/users/{id}` | Those roles, and a customer only for the linked self |
| Update | `PUT /api/users/{id}` | MANAGER, ADMIN. A customer updates self with `PUT /api/me/profile` |
| Delete | `DELETE /api/users/{id}` | MANAGER, ADMIN, and only when the customer has no accounts |
| Accounts of a customer | `GET /api/users/{id}/accounts` | Staff and admin |

Search is `GET /api/users/search?firstName=`. The customer document has one `name` field, not separate first and last names. The query is a case-insensitive prefix: `firstName=josvier` matches `Josvier Rodriguez`. No match is HTTP 200 and `[]`. A blank value is 400. A customer token is 403.

Premium accounts already exist as `GET /api/accounts/premium?threshold=`. MANAGER, AUDITOR, and ADMIN may read them. The threshold is a minimum balance.

Deposit is `POST /api/accounts/{id}/deposit`. Withdraw is `POST /api/accounts/{id}/withdraw`. Each method is `@Transactional`. It updates the balance and inserts one `transactions` row of type `DEPOSIT` or `WITHDRAW`. A failed amount check does not insert a row.

Staff transfer is `POST /api/accounts/transfer` and uses internal account ids. A customer previews with `POST /api/me/transfers/preview` and submits with `POST /api/me/transfers`. The destination is a public 12-digit `accountNumber`, not another customer's Mongo id. The preview returns a masked number and a short name such as `Ethan P.` It does not return the other customer's balance, history, or internal ids.

One transfer writes `TRANSFER_OUT` on the source and `TRANSFER_IN` on the destination, with the same `transferReference`, and a banking audit. Those writes share one MongoDB transaction. If any write fails, the whole transfer rolls back. The source and destination cannot be the same account. The source must have enough balance.

A customer can move money to another customer's public account number. Asking for that other account by id still returns 404. A teller can deposit and withdraw and cannot transfer. A manager or admin can transfer between accounts by id.

An empty transaction list, an empty search, and a customer with no accounts are successful empty lists. The React screen uses `EmptyState`, not `ErrorState`.

## Why it is built this way

If the balance changed and the history insert failed, the books would not match. The transaction makes those writes succeed or fail together. Decimal128 avoids the cents errors of binary floating point.

Search stays a prefix on `name` so the classroom example exists without splitting the customer model into first and last name.

## Technical concept

The code-level path for search is the place to see every layer on one request:

```mermaid
flowchart TD
    controller[UserController.searchByFirstName]
    service[UserServiceImpl.searchByFirstName]
    port[UserRepository.findByNameStartingWithIgnoreCase]
    adapter[MongoUserRepositoryAdapter]
    spring[SpringDataUserMongoRepository]
    atlas[(MongoDB Atlas users)]

    controller --> service --> port --> adapter --> spring --> atlas
```

`UserController` only reads the query parameter and the HTTP role annotation. `UserServiceImpl` trims the text, rejects a blank value, checks `CUSTOMER_ANY_READ`, and calls the repository. The repository does not load every customer and filter in memory. Spring Data builds the prefix query.

A MongoDB transaction here means the deposit or withdraw or transfer is one atomic unit of work. Atomic means the reader does not see half of the transfer.
