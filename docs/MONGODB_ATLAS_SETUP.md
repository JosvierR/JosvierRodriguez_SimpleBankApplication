# MongoDB Atlas setup

This guide connects the Simple Bank API to a free MongoDB Atlas cluster. `.env.example` only shows the variable names. Spring Boot does not read `.env` files. Put the real values in environment variables for the terminal that starts the application.

Never commit `MONGODB_URI`. It contains the database username and password.

## 1. Atlas account

Create an account at [https://www.mongodb.com/atlas](https://www.mongodb.com/atlas), or sign in to the account you already use for class.

## 2. Free cluster

Create a cluster on the free tier (M0). A shared free cluster is enough for this coursework. Wait until the cluster status is ready.

## 3. Database user

In Atlas, open Database Access and add a database user for the application.

This user is not the email and password you use to log into the Atlas website. The website account administers the project. The database user is the credential the Java driver sends.

Give that database user only `readWrite` on the `simple_bank` database. Do not give it atlas admin or access to every database.

## 4. Network access

Open Network Access and add your current public IP address.

`0.0.0.0/0` allows every address on the internet to attempt a connection. Use it only as a temporary development workaround, for example when your IP changes on a campus network and you will remove the entry afterward. A specific IP is the safer choice because a stolen database password is useless from an address Atlas does not allow.

## 5. Copy the Java connection string

Atlas → Connect → Drivers → Java.

Copy the `mongodb+srv://` URI. Replace the password placeholder with the database user's password.

If the password contains a reserved URI character, percent-encode it before pasting:

| Character | Encoded |
| --- | --- |
| `@` | `%40` |
| `:` | `%3A` |
| `/` | `%2F` |
| `?` | `%3F` |
| `#` | `%23` |
| `%` | `%25` |

Leave the database name out of the URI path. The application selects `simple_bank` with `MONGODB_DATABASE`.

The SRV URI uses TLS. That is the Atlas default and should stay enabled.

## 6. Start the API

Windows PowerShell:

```powershell
$env:MONGODB_URI="mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank"
$env:MONGODB_DATABASE="simple_bank"
.\mvnw.cmd spring-boot:run
```

Windows CMD:

```text
set MONGODB_URI=mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank
set MONGODB_DATABASE=simple_bank
mvnw.cmd spring-boot:run
```

macOS and Linux:

```text
export MONGODB_URI="mongodb+srv://<username>:<url-encoded-password>@<cluster-host>/?retryWrites=true&w=majority&appName=SimpleBank"
export MONGODB_DATABASE="simple_bank"
./mvnw spring-boot:run
```

Swagger UI: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

## 7. Confirm the data

After creating a user, an account, a deposit, and a withdrawal, open Atlas Data Explorer. The database `simple_bank` should contain `users`, `accounts`, and `transactions`. Balances and amounts should be Decimal128, not Double. The `users` collection should have a unique index on `email`.

Stop the application and start it again with the same variables. `GET /api/accounts/{id}` for the same account id must still return the balance. That restart is the proof that the data is in Atlas and not in a `ConcurrentHashMap`.
