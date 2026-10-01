# Trainer demo runbook

About 12 minutes. Use the demo stack so the live database is `simple_bank_demo`. Copy usernames and passwords from `docs/demo-credentials.txt` into the Postman environment locally. Do not paste those passwords into chat, the collection, or the README.

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml up --build -d
```

Open the React app at `http://localhost:3000` and Postman against `http://localhost:8080/api`.

1. **Atlas.** In MongoDB Atlas, show `simple_bank_demo` and the `users` collection. Point at a password hash in `auth_users` and say it is BCrypt, not the password.

2. **Layers.** Open `UserController.searchByFirstName`, then `UserServiceImpl.searchByFirstName`, then `SpringDataUserMongoRepository.findByNameStartingWithIgnoreCase`. Say: controller, service, repository, Spring Data, Atlas.

3. **Customer CRUD.** In Postman, run Authentication → Admin Login. Then Customer CRUD Demo: create, list, get, update, delete. The token is the admin token. A customer token is not used for staff CRUD.

4. **Search and filter.** Run Users → Search Customer By First Name (`firstName=Josvier`). Then Search First Name With No Match and show `200` and `[]`. Run GET Premium Accounts.

5. **Register and login.** Run JWT Authentication → Register. The new login is `CUSTOMER`. Mention that registering `admin` returns 409 `RESERVED_USERNAME`. Then Login.

6. **JWT.** Show the login JSON has `token` and `tokenType: Bearer`, and no password. Do not read the token aloud. In the IDE, show `JwtService` and `JwtAuthenticationFilter`.

7. **Customer versus admin.** Run the folder Trainer JWT Authorization Demo in order:
   - Customer Login → 200, stores `customerToken`
   - Customer Calls Customer Portal → 200
   - Customer Calls Admin Endpoint → 403
   - Admin Login → 200, stores `adminToken`
   - Admin Calls Admin Endpoint → 200

8. **Landing.** Open `/` signed out. Show `LandingPage`, then `PublicHeader` and `PublicFooter` in the IDE. Sign in and show Open app instead of Sign in. Switch to Español.

9. **Network.** On Customers, filter the Network tab to `users`. The request is `/api/users` on the page origin. Vite or Nginx forwarded it. No fake customer array is rendered.

10. **Loading, empty, error.** Reload Customers and point at the skeleton. Search a name that matches nobody and point at `EmptyState`. As the customer, open a staff-only screen or replay the 403 and point at `ErrorState` without a stack trace.

11. **Customer and accounts.** As a manager or admin, open a customer and show `GET /api/users/{id}/accounts`. Sign in as that customer and show `GET /api/me/accounts`.

12. **If time remains.** Open the role dashboards. The charts are Recharts fed by `GET /api/dashboard`. The tables are TanStack. The language selector is en/es/fr.

Stop the stack when finished:

```powershell
docker compose -f docker-compose.yml -f docker-compose.demo.yml down
```
