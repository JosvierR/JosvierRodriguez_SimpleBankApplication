# Final presentation runbook

About 12 minutes. Open the canonical repository, then the running app. Do not read passwords, tokens, or connection strings aloud.

Canonical branch: `ReactFrontend-BankApp-Making-RestCall-To-Backend`

GitHub Actions: https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/workflows/ci.yml?query=branch%3AReactFrontend-BankApp-Making-RestCall-To-Backend

Staging frontend and backend URLs are recorded in [submission links](submission-links.md) after a real deploy. Until that page lists them, present the local Docker demo and say staging is prepared in GitHub but not promoted to a public host yet. Production is pending a separate approval. Do not open `deploy/vercel-production` as if it were live.

## Order

1. **Assignment.** One bank, five roles, React, Spring Boot, MongoDB Atlas, JWT, and tests. The source of truth is the canonical branch. Staging receives that same commit. Production receives an approved staging commit only.

2. **Architecture.** Open [C4 architecture](c4-architecture.md), then [the zoomed pages](c4/README.md). Name context, containers, and components. The browser never holds the database URI.

3. **Atlas.** Show the database for the environment you are running. Demo data lives only in `simple_bank_demo`. Point at a password hash and say BCrypt.

4. **Landing.** Open `/` signed out. English first. Mention Español and Français. Sign in is on `/login`.

5. **Customer.** Sign in as a customer. Open the dashboard. The total balance is a full amount, not an ellipsis. Owned account numbers are the full 12 digits.

6. **Accounts.** Open My Accounts and one account. Copy an owned number. The toast confirms the copy.

7. **Transfer.** Start a transfer from an owned account. The source shows that full number. Preview a destination by its public number. The confirmation shows a shortened name and a masked number, `••••` plus the last four digits.

8. **Privacy.** Submit one small transfer only if this is the prepared demo, not on every rehearsal. Show `TRANSFER_OUT` and `TRANSFER_IN` with the same reference. Then show that opening the recipient account by its internal id returns 404.

9. **Staff.** Open the manager or admin dashboard. As the customer, show that `/api/admin/whoami` is 403. As admin, it is 200.

10. **Security.** In the IDE, show `JwtService` and the BCrypt encoder. Login JSON has a token and no password. Do not display the token.

11. **CI.** Open the Actions page. Backend tests, frontend quality, Docker build, and Required CI are green for the canonical SHA.

12. **Staging shape.** Open [deployment environments](deployment-environments.md). Vercel serves React. Render serves Spring Boot. Atlas holds `simple_bank_staging` apart from demo and production. Readiness is `GET /api/public/ready`.

13. **Close.** Return to the context diagram. One system, one database outside it, roles inside the API.

## Backup pages

- [Dashboard design](dashboard-design.md)
- [Transfer flow](transfer-flow.md)
- [Trainer answers](trainer-qa.md)
- Screenshots under `docs/screenshots/`
