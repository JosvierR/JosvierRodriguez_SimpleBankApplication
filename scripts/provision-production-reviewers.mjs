import { readFileSync } from 'node:fs';

const api = (process.env.API_BASE_URL || '').replace(/\/$/, '');
const adminUsername = process.env.ADMIN_USERNAME || '';
const adminPassword = process.env.ADMIN_PASSWORD || '';
const roster = JSON.parse(readFileSync(new URL('../docs/production-reviewer-accounts.json', import.meta.url), 'utf8'));

if (!api || !adminUsername || !adminPassword) {
  console.error('API_BASE_URL, ADMIN_USERNAME, and ADMIN_PASSWORD are required');
  process.exit(1);
}

async function call(path, { method = 'GET', token, body, ok = [200] } = {}) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!ok.includes(response.status)) {
    const detail = payload?.message || payload?.error || response.status;
    throw new Error(`${method} ${path} returned ${response.status}: ${detail}`);
  }
  return payload;
}

function money(value) {
  return Number(value);
}

const login = await call('/auth/login', {
  method: 'POST',
  body: { username: adminUsername, password: adminPassword },
  ok: [200],
});
const token = login.token;
if (!token) {
  throw new Error('Admin login did not return a token');
}
console.log(`admin login ok user=${login.username}`);

let authUsers = await call('/admin/auth-users', { token });

for (const account of roster.accounts) {
  let authUser = authUsers.find((user) => user.username === account.username);
  if (!authUser) {
    await call('/auth/register', {
      method: 'POST',
      body: { username: account.username, email: account.email, password: account.password },
      ok: [201, 409],
    });
    authUsers = await call('/admin/auth-users', { token });
    authUser = authUsers.find((user) => user.username === account.username);
  }
  if (!authUser) {
    throw new Error(`Auth user ${account.username} was not created`);
  }
  if (authUser.role !== account.role) {
    authUser = await call(`/admin/auth-users/${authUser.id}/role`, {
      method: 'PUT',
      token,
      body: { role: account.role },
      ok: [200],
    });
  }
  console.log(`auth ${account.username} role=${authUser.role}`);

  if (account.role !== 'CUSTOMER') {
    continue;
  }

  const bankUsers = await call('/users', { token });
  let bankUser = bankUsers.find((user) => user.email === account.email);
  if (!bankUser) {
    bankUser = await call('/users', {
      method: 'POST',
      token,
      body: { name: account.name, email: account.email },
      ok: [201],
    });
  }
  if (authUser.bankUserId !== bankUser.id) {
    authUser = await call(`/admin/auth-users/${authUser.id}/customer-link`, {
      method: 'PUT',
      token,
      body: { bankUserId: bankUser.id },
      ok: [200],
    });
  }

  let bankAccounts = await call(`/users/${bankUser.id}/accounts`, { token });
  for (const desired of account.accounts) {
    let bankAccount = bankAccounts.find((item) => item.accountType === desired.type);
    if (!bankAccount) {
      bankAccount = await call('/accounts', {
        method: 'POST',
        token,
        body: { userId: bankUser.id, accountType: desired.type },
        ok: [201],
      });
      bankAccounts.push(bankAccount);
    }
    if (money(bankAccount.balance) === 0 && desired.openingBalance > 0) {
      bankAccount = await call(`/accounts/${bankAccount.accountId}/deposit`, {
        method: 'POST',
        token,
        body: { amount: desired.openingBalance },
        ok: [200],
      });
      bankAccounts = bankAccounts.map((item) => (item.accountId === bankAccount.accountId ? bankAccount : item));
    }
  }
  console.log(`customer ${account.username} linked accounts=${bankAccounts.length}`);
}

const transfer = roster.sampleTransfer;
const refreshed = await call('/admin/auth-users', { token });
const fromAuth = refreshed.find((user) => user.username === transfer.fromUsername);
const toAuth = refreshed.find((user) => user.username === transfer.toUsername);
const fromAccounts = await call(`/users/${fromAuth.bankUserId}/accounts`, { token });
const toAccounts = await call(`/users/${toAuth.bankUserId}/accounts`, { token });
const fromAccount = fromAccounts.find((item) => item.accountType === transfer.fromType);
const toAccount = toAccounts.find((item) => item.accountType === transfer.toType);
const history = await call(`/accounts/${fromAccount.accountId}/transactions`, { token });
const alreadyTransferred = history.some((item) => item.type === 'TRANSFER_OUT');
if (!alreadyTransferred) {
  await call('/accounts/transfer', {
    method: 'POST',
    token,
    body: {
      fromAccountId: fromAccount.accountId,
      toAccountId: toAccount.accountId,
      amount: transfer.amount,
    },
    ok: [200],
  });
  console.log('sample transfer created');
} else {
  console.log('sample transfer already present');
}

console.log('production reviewer roster ready');
