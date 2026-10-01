# Trainer questions and answers

Short answers for a screen-share. Say what the project does, then the definition.

## Layers

**What is a controller?**
The HTTP edge. `UserController` reads the method, path, and body, calls a service, and returns a status. It does not decide whether an email is already taken and it does not query MongoDB.

**What is a service?**
The use case. `UserServiceImpl.searchByFirstName` checks the caller's permission, rejects a blank name, and asks the repository for matches.

**Why use a repository?**
So the service depends on `UserRepository`, not on a Mongo driver. Tests can substitute a fake. The database can change without rewriting the banking rules.

**Why not call Mongo from the controller?**
The controller would then mix HTTP, authorization, and queries. The search endpoint shows the split: controller, then service, then `findByNameStartingWithIgnoreCase`, then Spring Data, then Atlas.

**What is REST?**
Resources and HTTP verbs. Customers are `/api/users`. Create is POST, read is GET, update is PUT, delete is DELETE. A search with no rows is still a successful GET that returns `[]`.

## CORS and the browser

**What is CORS?**
A browser rule. A page on one origin cannot read a response from another origin unless that server allows it.

**How did this project avoid CORS problems?**
The React code calls `/api` on the same origin. Vite proxies that path to port 8080 in development. Nginx proxies it to the backend container in Docker. The browser never makes a cross-origin call, so the API does not need `@CrossOrigin("*")`.

## React data flow

**What are props?**
Inputs a parent gives a child. `LandingPage` passes `isAuthenticated` to `PublicHeader`.

**Parent to child?**
Data flows down. The landing page knows whether the visitor is signed in. The header only receives the boolean and chooses Sign in or Open app.

**Child to parent?**
Events flow up through callbacks. `ConfirmDialog` calls `onConfirm`. `ErrorState` calls `onRetry`. The child does not set the parent's state directly.

**What is state?**
Data a component remembers between renders. `PublicHeader` can remember whether the mobile menu is open. The access token lives in `sessionStorage` and is read by the auth provider.

**Why a loading state?**
The customer list is empty until the response arrives. `PageLoading` shows a skeleton so that wait is not mistaken for "there are no customers."

**Why isn't an empty list an error?**
The server understood the request and found nothing. `GET /api/users/search?firstName=zzzz-no-match` returns 200 and `[]`. The page renders `EmptyState`. A 404 would mean the resource itself is missing.

## Security

**Authentication versus authorization?**
Authentication is who you are: login checks the password and returns a JWT. Authorization is what you may do: a customer token can open `/api/me` and cannot open `/api/admin/whoami`.

**What is a JWT?**
A signed access token. After login the server returns it. Later requests send `Authorization: Bearer <token>`. Spring Security does not keep a server session for that call.

**What are JWT claims?**
The statements inside the token, such as the subject (username), the roles, and the expiration. The frontend stores the token. It does not decide the roles.

**Why is the JWT signed?**
So a client cannot edit the role and still have a token the server accepts. The server checks the signature with `JWT_SECRET`. If the signature or the expiry fails, the response is 401.

**Where does the frontend store the JWT?**
`sessionStorage`, under `simple-bank-access-token`. Closing the tab clears it. The password is never stored.

**Why not put the password or the token in the database as the session?**
The password is hashed with BCrypt at registration and then discarded. The token is checked from its signature and expiry, so the API stays stateless. A stolen database row is not a usable password.

**What is BCrypt?**
A slow password hash. Registration stores the hash. Login hashes the attempt and compares. The API responses do not include `password` or `passwordHash`.

**Hashing versus encryption?**
A hash is one way. You can check a password against it, and you cannot turn the hash back into the password. Encryption is reversible with a key. Passwords in this project are hashed.

**401 versus 403?**
401 means the caller is not authenticated: missing token, bad token, or bad password. 403 means the caller is authenticated and is not allowed to do that action. A customer calling `GET /api/admin/whoami` is 403.

**Why do some foreign customer resources return 404?**
Hiding the resource is safer than confirming it exists. Customer A asking for Customer B's account gets 404, not a body that proves the account is there. A role that is simply not allowed, such as customer-to-admin, is 403.

**Basic Auth, JWT, and OAuth?**
Basic Auth sends the username and password with requests. It is simple and a poor fit for this single-page app, and it is not implemented.

JWT is what this project implements: one signed access token after login, checked on every request, with a role claim.

OAuth 2.0 and OpenID Connect delegate login to an identity provider. They are the next step when many applications share one login. They are not implemented here. Knowing the sequence is the coursework point: Basic Auth, then JWT, then OAuth.

**Why can the username `admin` not be registered?**
`AuthIdentityPolicy` treats `admin`, `Admin`, `ADMIN`, and ` admin ` as the same reserved identity. Public registration returns 409 and the code `RESERVED_USERNAME`. An existing user with that exact username cannot be given a non-admin role. Other staff accounts, such as `ava.admin`, are normal. There is no built-in admin password.

## Data

**What is MongoDB Atlas?**
The hosted MongoDB database. Spring Data talks to it through `MONGODB_URI`. Demo mode uses the separate `simple_bank_demo` database.

**Why Decimal128 and BigDecimal for money?**
Binary floating point cannot represent cents exactly. Amounts are `BigDecimal` in Java and Decimal128 in MongoDB, with two decimal places.

**Why Mongo transactions for deposit, withdraw, and transfer?**
The balance change and the transaction history have to succeed or fail together. A transfer also updates two accounts. The transaction keeps those writes atomic.
