import { readFileSync } from 'node:fs';

const api = (process.env.API_BASE_URL || 'https://simple-bank-api-production.onrender.com/api').replace(/\/$/, '');
const roster = JSON.parse(readFileSync(new URL('../docs/production-reviewer-accounts.json', import.meta.url), 'utf8'));
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`PASS ${name}`);
    return;
  }
  failures.push(detail ? `${name}: ${detail}` : name);
  console.error(`FAIL ${name}${detail ? ` ${detail}` : ''}`);
}

async function call(path, { method = 'GET', token, body } = {}) {
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
  return { status: response.status, payload };
}

async function login(username, password) {
  const result = await call('/auth/login', { method: 'POST', body: { username, password } });
  return { status: result.status, token: result.payload?.token, roles: result.payload?.roles || [] };
}

const health = await call('/public/health');
check('health', health.status === 200 && health.payload?.status === 'UP' && health.payload?.environment === 'production');

const ready = await call('/public/ready');
check('ready', ready.status === 200 && ready.payload?.status === 'UP' && ready.payload?.environment === 'production' && typeof ready.payload?.revision === 'string');
console.log(`ready revision=${ready.payload?.revision || 'missing'}`);

const config = await call('/public/config');
check('config', config.status === 200 && config.payload?.demoMode === false && config.payload?.environment === 'production');

const badLogin = await call('/auth/login', { method: 'POST', body: { username: 'nora.review', password: 'not-the-password' } });
check('invalid login', badLogin.status === 401);

const sessions = new Map();
for (const account of roster.accounts) {
  const session = await login(account.username, account.password);
  sessions.set(account.username, session);
  check(`login ${account.username}`, session.status === 200 && session.roles.includes(account.role), `status=${session.status}`);
}

const nora = sessions.get('nora.review');
const leo = sessions.get('leo.review');
const teller = sessions.get('review.teller');
const manager = sessions.get('review.manager');
const auditor = sessions.get('review.auditor');
const admin = sessions.get('review.admin');

const noraMe = await call('/me', { token: nora.token });
check('nora profile linked', noraMe.status === 200 && noraMe.payload?.bankUserLinked === true);
const noraAccounts = await call('/me/accounts', { token: nora.token });
check('nora sees own accounts', noraAccounts.status === 200 && noraAccounts.payload?.length === 2);
const noraChecking = noraAccounts.payload?.find((item) => item.accountType === 'CHECKING');
const noraHistory = await call(`/me/accounts/${noraChecking?.accountId}/transactions`, { token: nora.token });
check('nora has transfer history', noraHistory.status === 200 && noraHistory.payload?.some((item) => item.type === 'TRANSFER_OUT'));

const leoAccounts = await call('/me/accounts', { token: leo.token });
const leoChecking = leoAccounts.payload?.find((item) => item.accountType === 'CHECKING');
check('leo sees own checking', leoAccounts.status === 200 && leoAccounts.payload?.length === 1);
const leoHistory = await call(`/me/accounts/${leoChecking?.accountId}/transactions`, { token: leo.token });
check('leo sees incoming transfer', leoHistory.status === 200 && leoHistory.payload?.some((item) => item.type === 'TRANSFER_IN'));

const noraReadsLeo = await call(`/accounts/${leoChecking?.accountId}`, { token: nora.token });
check('nora cannot read leo account', noraReadsLeo.status === 403);
const noraUsers = await call('/users', { token: nora.token });
check('nora cannot list customers', noraUsers.status === 403);
const noraAdmin = await call('/admin/whoami', { token: nora.token });
check('nora cannot open admin api', noraAdmin.status === 403);
const noraDashboard = await call('/dashboard', { token: nora.token });
check('nora dashboard', noraDashboard.status === 200);

const tellerUsers = await call('/users', { token: teller.token });
const tellerAccounts = await call('/accounts', { token: teller.token });
const tellerAdmin = await call('/admin/whoami', { token: teller.token });
check('teller lists customers', tellerUsers.status === 200 && tellerUsers.payload?.some((user) => user.email === 'nora.review@review.simplebank.test'));
check('teller lists accounts', tellerAccounts.status === 200 && tellerAccounts.payload?.length >= 3);
check('teller cannot open admin api', tellerAdmin.status === 403);

const managerAudits = await call('/audits', { token: manager.token });
const managerPremium = await call('/accounts/premium?threshold=1000', { token: manager.token });
check('manager reads audits', managerAudits.status === 200 && managerAudits.payload?.length > 0);
check('manager reads premium accounts', managerPremium.status === 200);

const auditorAccounts = await call('/accounts', { token: auditor.token });
const auditorAudits = await call('/audits', { token: auditor.token });
const auditorDeposit = await call(`/accounts/${leoChecking?.accountId}/deposit`, {
  method: 'POST',
  token: auditor.token,
  body: { amount: 0.01 },
});
check('auditor reads accounts', auditorAccounts.status === 200);
check('auditor reads audits', auditorAudits.status === 200);
check('auditor cannot deposit', auditorDeposit.status === 403);

const adminWho = await call('/admin/whoami', { token: admin.token });
const adminUsers = await call('/admin/auth-users', { token: admin.token });
const adminSecurity = await call('/admin/security-audits', { token: admin.token });
const adminDashboard = await call('/dashboard', { token: admin.token });
check('admin whoami', adminWho.status === 200);
check('admin sees reviewer roster', roster.accounts.every((account) => adminUsers.payload?.some((user) => user.username === account.username)));
check('admin security audit', adminSecurity.status === 200);
check('admin dashboard', adminDashboard.status === 200);

if (failures.length > 0) {
  console.error(`production reviewer check failed: ${failures.length}`);
  process.exit(1);
}
console.log('production reviewer check passed');
