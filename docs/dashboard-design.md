# Role-Specific Dashboard Design

The dashboard asks one question: **what does this person need to know or do immediately after signing in?** It does not expose every field available to the API, and it does not reuse one generic metric grid with different labels. The backend derives the role and returns a minimal role-specific DTO from `GET /api/dashboard`.

## Shared decisions

- All numbers come from persisted accounts, transactions, identities, or audit records. There are no decorative trends or invented comparisons.
- “Today” and “last 30 days” use the backend UTC clock.
- Currency totals are aggregated as `BigDecimal` on the backend and formatted for the selected locale in the browser.
- Every view has a localized skeleton, retry state, and empty state.
- Lists mask account identifiers as `•••• suffix` unless a technical detail view requires the full identifier.
- Recharts appears only where a time series answers a real money-movement question.
- Chart totals are written in text near the chart. Deposit, withdrawal, and transfer lines also differ by stroke pattern, not color alone.

## Customer

### Who is this user?

A customer is the authenticated owner of one explicitly linked bank-customer record. Their mental model is personal financial position, not bank operations.

### What do they need immediately?

- Current total balance
- Owned accounts and masked account suffixes
- Recent deposits and withdrawals
- Thirty-day deposit and withdrawal movement
- A direct path to transfer between eligible owned accounts

### What is shown?

The view shows `totalBalance`, account count, owned account summaries, 30-day deposit and withdrawal totals, an owned-account activity series, and recent owned transactions. A lightweight line chart answers, “when did money enter or leave my accounts?”

### What is deliberately not shown?

No other customer, bank-wide balance, staff operator, audit actor, `authUserId`, `bankUserId`, or global count is returned. An unlinked login receives a safe pending-link response with empty financial collections.

### Why?

The dashboard is useful without weakening object ownership. All transaction aggregation begins with the authenticated customer’s owned account IDs.

## Teller

### Who is this user?

A teller performs customer-service banking operations. Their first task is usually to find a customer or account, then complete a deposit, withdrawal, or account-opening workflow.

### What do they need immediately?

- Customer and account search
- New accounts today
- Their operation count today
- Their deposit and withdrawal totals today
- Their own recent operation history
- Quick paths to the customer directory, account directory, and account opening

### What is shown?

The search field forwards the entered name, email, or identifier into the existing directory filters. Today metrics use UTC. Recent operations are selected by the authenticated teller’s `actorAuthUserId` and show only customer name, masked account suffix, action, amount, and time.

### What is deliberately not shown?

No global audit trail, bank balance, 30-day executive analytics, transfer action, access-management data, password material, or internal authentication identifiers appear.

### Why?

This keeps the teller focused on service work and makes “my operations” truthful rather than presenting global activity as personal performance.

## Manager

### Who is this user?

A manager monitors bank operations and can perform the broader banking workflows already allowed by RBAC.

### What do they need immediately?

- Total bank balance and customer/account counts
- Checking and savings mix
- Count of accounts meeting the educational premium threshold
- Thirty-day deposit, withdrawal, and transfer volume
- Recent audited banking operations
- Paths to transfers and the full banking audit

### What is shown?

The view combines a bank-position metric strip, three real money-movement totals, a 30-day line chart, restrained account-mix bars, and recent banking audits. The chart answers, “how did audited money movement vary over this period?”

The premium classification means a current account balance of at least `$1,000.00`. It is not an APY, status program, or regulatory category.

### What is deliberately not shown?

No fake percentage trends, access-role distribution, disabled-login count, security-audit details, or regulatory claims appear.

### Why?

Managers need operational position and movement. Identity administration belongs to the administrator, so the manager view stays a banking view.

## Auditor

### Who is this user?

An auditor investigates and verifies banking activity but cannot mutate customers, accounts, money, or identities.

### What do they need immediately?

- Number of audit records in the last 30 days
- Number of distinct responsible operators
- Deposit, withdrawal, and transfer counts
- Recent audit details
- Read-only navigation to audits, customers, and accounts

### What is shown?

The dashboard includes an explicit read-only notice, audit-coverage metrics, accessible action-count bars, review links, and recent banking activity with customer, masked account, amount, actor, and time.

### What is deliberately not shown?

No create, edit, delete, deposit, withdrawal, transfer, account-opening, access-management, or security-audit action is present. Security-administration audits remain an administrator concern.

### Why?

The design supports investigation without implying authority the role does not possess. Authorization tests verify that write actions are absent and the API continues to reject mutations.

## Administrator

### Who is this user?

An administrator governs identities, primary roles, enablement, and links between customer logins and bank-customer records.

### What do they need immediately?

- Active and disabled identity counts
- Effective role distribution
- Linked and unlinked customer-login counts
- Recent security changes
- Direct access to Access Management and Security Audit
- Concise banking context for orientation

### What is shown?

The view centers identity health and access governance. Role distribution uses labeled bars. Link coverage shows whether customer identities are connected. Recent security actions translate the existing enum values at the UI boundary and identify actor and target username. Customer/account counts and a small recent-banking section provide context.

### What is deliberately not shown?

No password hash, password, JWT, secret, or raw target authentication ID is returned. The dashboard is not a copy of the manager’s money-movement analytics and contains no executive chart.

### Why?

The administrator’s first responsibility is access health. Bank-wide operational analytics would dilute that task, while a compact banking reference helps an administrator understand the environment affected by identity decisions.

## Why a server-aggregated endpoint?

The previous dashboard composed customers, accounts, transactions, banking audits, auth users, and security audits with several frontend requests. That approach created request waterfalls, exposed broader collections than each view required, and could calculate inconsistent snapshots.

`GET /api/dashboard` now:

1. Loads the current persisted actor.
2. Resolves the effective role on the server.
3. Runs targeted ownership-, actor-, or time-bounded repository queries.
4. Aggregates money with `BigDecimal`.
5. Returns one minimal role DTO.
6. Lets React switch on the returned role without accepting a browser-selected role.

This architecture makes authorization, privacy, aggregation, and UI behavior independently testable while preserving the existing RBAC and ownership model.
