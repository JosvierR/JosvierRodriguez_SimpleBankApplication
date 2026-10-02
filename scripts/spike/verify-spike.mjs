import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { cents, formatCents } from "./money.mjs";

const apiBase = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const envName = process.env.ENV_NAME || "";
const passwordFile = process.env.SPIKE_PASSWORDS_FILE || "";
const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const allowOrigin = process.env.SPIKE_CORS_ALLOW || "";
const denyOrigins = (process.env.SPIKE_CORS_DENY || "").split(",").map((value) => value.trim()).filter(Boolean);
const allowMutation = process.env.ALLOW_SPIKE_MUTATION === "true";
const allowedEnvs = new Set(["development", "staging", "production"]);
const results = [];

function fail(message) {
  throw new Error(message);
}

function record(name, status, detail = "") {
  results.push({ name, status, detail });
  console.log(`RESULT ${name} ${status}${detail ? ` ${detail}` : ""}`);
}

function requireValue(name, value) {
  if (!value) fail(`Missing ${name}`);
}

function loadManifest() {
  const file = new URL("./product-spike-manifest.json", import.meta.url);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (manifest.identities?.length !== 20) fail("Manifest does not contain 20 identities");
  return manifest;
}

function loadPasswords() {
  requireValue("SPIKE_PASSWORDS_FILE", passwordFile);
  const absolute = resolve(passwordFile);
  if (!relative(process.cwd(), absolute).startsWith("..")) fail("SPIKE_PASSWORDS_FILE must stay outside this repository");
  return JSON.parse(readFileSync(absolute, "utf8"));
}

async function request(path, options = {}) {
  const response = await fetch(path.startsWith("http") ? path : `${apiBase}${path}`, options);
  const text = await response.text();
  return { response, text };
}

function parseJson(text, label) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    fail(`${label} did not return JSON`);
  }
}

function assertNoSecrets(text, label) {
  const lowered = text.toLowerCase();
  for (const marker of ["mongodb+srv://", "mongodb://", "jwt_secret", "bearer eyj"]) {
    if (lowered.includes(marker)) fail(`${label} exposed a secret marker`);
  }
}

function bearer(token, json = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function login(username, password) {
  const result = await request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (result.response.status !== 200) fail(`${username} login HTTP ${result.response.status}`);
  const body = parseJson(result.text, "login");
  if (!body?.token) fail(`${username} login did not return a token`);
  return body.token;
}

async function call(path, token, options = {}) {
  return request(path, { ...options, headers: { ...bearer(token, Boolean(options.body)), ...options.headers } });
}

async function expectStatus(path, status, token, label, options = {}) {
  const result = token ? await call(path, token, options) : await request(path, options);
  if (result.response.status !== status) fail(`${label} HTTP ${result.response.status}`);
  return result;
}

function accountOf(accounts, type) {
  return accounts.find((account) => account.accountType === type);
}

async function move(token, accountId, action, amount) {
  const result = await call(`/accounts/${accountId}/${action}`, token, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
  if (result.response.status !== 200) fail(`${action} ${amount} HTTP ${result.response.status}`);
  return parseJson(result.text, action);
}

async function main() {
  requireValue("API_BASE_URL", apiBase);
  requireValue("ENV_NAME", envName);
  if (!allowedEnvs.has(envName)) fail("ENV_NAME must be development, staging, or production");
  const manifest = loadManifest();
  const passwords = loadPasswords();
  const byRole = Object.fromEntries(["CUSTOMER", "TELLER", "MANAGER", "AUDITOR", "ADMIN"].map((role) => [
    role,
    manifest.identities.find((identity) => identity.role === role),
  ]));
  const sender = manifest.identities.find((identity) => identity.key === manifest.transfer.sender);
  const recipient = manifest.identities.find((identity) => identity.key === manifest.transfer.recipient);
  if (!sender || !recipient) fail("Transfer identities are missing");

  const health = await expectStatus("/public/health", 200, null, "health");
  const healthBody = parseJson(health.text, "health");
  assertNoSecrets(health.text, "health");
  if (healthBody.status !== "UP") fail("health is not UP");
  record("Health", "PASS", healthBody.environment);

  const ready = await expectStatus("/public/ready", 200, null, "ready");
  const readyBody = parseJson(ready.text, "ready");
  assertNoSecrets(ready.text, "ready");
  const config = await expectStatus("/public/config", 200, null, "config");
  const configBody = parseJson(config.text, "config");
  assertNoSecrets(config.text, "config");
  if (envName !== "development" && (configBody.environment !== envName || configBody.demoMode !== false)) {
    fail(`config environment=${configBody.environment} demoMode=${configBody.demoMode}`);
  }
  if (envName === "development" && !["local", "demo"].includes(configBody.environment)) {
    fail(`development config environment=${configBody.environment}`);
  }
  if (readyBody.status !== "UP" || readyBody.environment !== configBody.environment) fail("ready does not match config");
  record("Config", "PASS", `${configBody.environment} demoMode=${configBody.demoMode}`);

  const tokens = {};
  for (const identity of manifest.identities) {
    if (!passwords[identity.username]) fail(`Missing password entry for ${identity.username}`);
    tokens[identity.username] = await login(identity.username, passwords[identity.username]);
  }
  record("Customer login", "PASS", `${manifest.identities.length} identities`);

  const adminToken = tokens[byRole.ADMIN.username];
  const authUsers = parseJson((await expectStatus("/admin/auth-users", 200, adminToken, "auth users")).text, "auth users");
  const roles = { ADMIN: 0, MANAGER: 0, TELLER: 0, AUDITOR: 0, CUSTOMER: 0 };
  for (const identity of manifest.identities) {
    const found = authUsers.find((user) => user.username === identity.username);
    if (!found || found.role !== identity.role || found.email?.toLowerCase() !== identity.email.toLowerCase()) {
      fail(`Logical identity ${identity.username} does not match role or email`);
    }
    if (identity.kind === "staff" && found.bankUserId) fail(`Staff ${identity.username} is linked`);
    if (identity.kind === "customer" && !found.bankUserId) fail(`Customer ${identity.username} is not linked`);
    roles[identity.role] += 1;
  }
  if (roles.ADMIN !== 1 || roles.MANAGER !== 2 || roles.TELLER !== 3 || roles.AUDITOR !== 2 || roles.CUSTOMER !== 12) {
    fail(`Role distribution ${JSON.stringify(roles)}`);
  }
  record("20 logical identities", "PASS");
  record("Role distribution", "PASS", "1/2/3/2/12");

  await checkPermissions(tokens, byRole);
  const senderAccounts = parseJson((await expectStatus("/me/accounts", 200, tokens[sender.username], "sender accounts")).text, "sender accounts");
  const recipientAccounts = parseJson((await expectStatus("/me/accounts", 200, tokens[recipient.username], "recipient accounts")).text, "recipient accounts");
  const senderAccount = accountOf(senderAccounts, manifest.transfer.senderAccount);
  const recipientAccount = accountOf(recipientAccounts, manifest.transfer.recipientAccount);
  if (!/^\d{12}$/.test(senderAccount?.accountNumber || "") || !/^\d{12}$/.test(recipientAccount?.accountNumber || "")) {
    fail("Transfer accounts are missing a 12-digit number");
  }
  const senderTarget = sender.accounts.find((account) => account.type === manifest.transfer.senderAccount).startingBalance;
  const recipientTarget = recipient.accounts.find((account) => account.type === manifest.transfer.recipientAccount).startingBalance;
  record("Dashboard", "PASS");
  record("Own accounts", "PASS");

  const foreign = await call(`/accounts/${recipientAccount.accountId}`, tokens[sender.username]);
  const foreignHistory = await call(`/accounts/${recipientAccount.accountId}/transactions`, tokens[sender.username]);
  if (foreign.response.status !== 404 || foreignHistory.response.status !== 404) {
    fail(`foreign read HTTP ${foreign.response.status}/${foreignHistory.response.status}`);
  }
  record("Ownership 404", "PASS");
  record("Foreign history 404", "PASS");

  const missing = await request("/me");
  if (missing.response.status !== 401) fail(`missing token HTTP ${missing.response.status}`);
  record("Missing JWT 401", "PASS");
  const invalid = await request("/me", { headers: { Authorization: "Bearer not-a-jwt" } });
  if (invalid.response.status !== 401) fail(`invalid token HTTP ${invalid.response.status}`);
  record("Invalid JWT 401", "PASS");

  await checkCors();
  await checkLanguages();

  if (!allowMutation) {
    if (cents(senderAccount.balance) !== cents(senderTarget) || cents(recipientAccount.balance) !== cents(recipientTarget)) {
      fail(`Pristine balances required before a later mutation: sender ${senderAccount.balance} recipient ${recipientAccount.balance}`);
    }
    await preview(tokens[sender.username], senderAccount, recipientAccount.accountNumber, manifest.transfer.amount);
    record("Transfer preview privacy", "PASS");
    for (const name of ["Deposit", "Withdraw", "Transfer submit", "Ledger pair"]) record(name, "SKIP", "ALLOW_SPIKE_MUTATION is not true");
  } else {
    if (cents(senderAccount.balance) !== cents(senderTarget) || cents(recipientAccount.balance) !== cents(recipientTarget)) {
      fail("Refusing mutation because sender and recipient are not at pristine starting targets");
    }
    const teller = tokens[byRole.TELLER.username];
    await assertRoundTrip(teller, senderAccount.accountId, senderTarget, "10.25");
    await assertRoundTrip(teller, senderAccount.accountId, senderTarget, "100.10");
    await assertRoundTrip(teller, senderAccount.accountId, senderTarget, "1.00");
    record("Deposit", "PASS", "1.00 10.25 100.10");
    record("Withdraw", "PASS", "net zero");
    await preview(tokens[sender.username], senderAccount, recipientAccount.accountNumber, manifest.transfer.amount);
    record("Transfer preview privacy", "PASS");
    const submitted = await call("/me/transfers", tokens[sender.username], {
      method: "POST",
      body: JSON.stringify({
        sourceAccountId: senderAccount.accountId,
        destinationAccountNumber: recipientAccount.accountNumber,
        amount: manifest.transfer.amount,
      }),
    });
    if (submitted.response.status !== 200) fail(`transfer HTTP ${submitted.response.status}`);
    const receipt = parseJson(submitted.text, "transfer");
    const afterSender = accountOf(parseJson((await expectStatus("/me/accounts", 200, tokens[sender.username], "sender after")).text, "sender after"), manifest.transfer.senderAccount);
    const afterRecipient = accountOf(parseJson((await expectStatus("/me/accounts", 200, tokens[recipient.username], "recipient after")).text, "recipient after"), manifest.transfer.recipientAccount);
    const expectedSender = cents(senderTarget) - cents(manifest.transfer.amount);
    const expectedRecipient = cents(recipientTarget) + cents(manifest.transfer.amount);
    if (cents(afterSender.balance) !== expectedSender || cents(afterRecipient.balance) !== expectedRecipient) {
      fail(`final balances sender ${afterSender.balance} recipient ${afterRecipient.balance}`);
    }
    record("Transfer submit", "PASS", `${receipt.transferReference} ${formatCents(expectedSender)} ${formatCents(expectedRecipient)}`);
    const senderHistory = parseJson((await expectStatus(`/me/accounts/${senderAccount.accountId}/transactions`, 200, tokens[sender.username], "sender history")).text, "sender history");
    const recipientHistory = parseJson((await expectStatus(`/me/accounts/${recipientAccount.accountId}/transactions`, 200, tokens[recipient.username], "recipient history")).text, "recipient history");
    const outRow = senderHistory.find((row) => row.transferReference === receipt.transferReference && row.type === "TRANSFER_OUT");
    const inRow = recipientHistory.find((row) => row.transferReference === receipt.transferReference && row.type === "TRANSFER_IN");
    if (!outRow || !inRow || cents(outRow.amount) !== cents("1.00") || cents(inRow.amount) !== cents("1.00")) {
      fail("ledger pair amount or type did not match");
    }
    const stillForeign = await call(`/accounts/${recipientAccount.accountId}`, tokens[sender.username]);
    const stillHistory = await call(`/accounts/${recipientAccount.accountId}/transactions`, tokens[sender.username]);
    if (stillForeign.response.status !== 404 || stillHistory.response.status !== 404) fail("foreign account became readable after transfer");
    record("Ledger pair", "PASS", receipt.transferReference);
  }

  if (results.some((result) => result.status === "FAIL")) process.exit(1);
  console.log(`spike verify complete env=${envName} mutation=${allowMutation}`);
}

async function assertRoundTrip(token, accountId, startingBalance, amount) {
  const deposited = await move(token, accountId, "deposit", amount);
  if (cents(deposited.balance) !== cents(startingBalance) + cents(amount)) fail(`deposit ${amount} balance ${deposited.balance}`);
  const withdrawn = await move(token, accountId, "withdraw", amount);
  if (cents(withdrawn.balance) !== cents(startingBalance)) fail(`withdraw ${amount} balance ${withdrawn.balance}`);
}

async function preview(token, source, destinationNumber, amount) {
  const result = await call("/me/transfers/preview", token, {
    method: "POST",
    body: JSON.stringify({
      sourceAccountId: source.accountId,
      destinationAccountNumber: destinationNumber,
      amount,
    }),
  });
  if (result.response.status !== 200) fail(`preview HTTP ${result.response.status}`);
  const body = parseJson(result.text, "preview");
  assertNoSecrets(result.text, "preview");
  const masked = body.destinationAccountNumberMasked;
  if (!body.destinationDisplayName || !masked || masked === destinationNumber || !masked.endsWith(destinationNumber.slice(-4))) {
    fail("transfer preview did not mask the destination");
  }
  for (const key of ["destinationAccountId", "destinationBalance", "destinationUserId", "history", "transactions"]) {
    if (Object.prototype.hasOwnProperty.call(body, key)) fail(`transfer preview exposed ${key}`);
  }
}

async function checkPermissions(tokens, byRole) {
  const customer = tokens[byRole.CUSTOMER.username];
  const teller = tokens[byRole.TELLER.username];
  const manager = tokens[byRole.MANAGER.username];
  const auditor = tokens[byRole.AUDITOR.username];
  const admin = tokens[byRole.ADMIN.username];
  const senderAccounts = parseJson((await expectStatus("/me/accounts", 200, customer, "customer accounts")).text, "customer accounts");
  const own = senderAccounts[0];
  if (!own?.accountId) fail("customer has no account for permission checks");

  await expectStatus("/me", 200, customer, "customer self read");
  const customerDeposit = await call(`/accounts/${own.accountId}/deposit`, customer, { method: "POST", body: JSON.stringify({ amount: "1.00" }) });
  if (customerDeposit.response.status !== 403) fail(`customer deposit HTTP ${customerDeposit.response.status}`);
  record("Customer positive permission", "PASS", "GET /me");
  record("Customer negative permission", "PASS", "POST deposit 403");

  await expectStatus("/users", 200, teller, "teller customer read");
  const tellerPremium = await call("/accounts/premium?threshold=0.01", teller);
  if (tellerPremium.response.status !== 403) fail(`teller premium HTTP ${tellerPremium.response.status}`);
  record("Teller positive permission", "PASS", "GET /users");
  record("Teller negative permission", "PASS", "GET /accounts/premium 403");

  await expectStatus("/accounts/premium?threshold=0.01", 200, manager, "manager premium");
  const managerAdmin = await call("/admin/whoami", manager);
  if (managerAdmin.response.status !== 403) fail(`manager whoami HTTP ${managerAdmin.response.status}`);
  record("Manager positive permission", "PASS", "GET /accounts/premium");
  record("Manager negative permission", "PASS", "GET /admin/whoami 403");

  await expectStatus("/audits", 200, auditor, "auditor audits");
  const auditorDeposit = await call(`/accounts/${own.accountId}/deposit`, auditor, { method: "POST", body: JSON.stringify({ amount: "1.00" }) });
  if (auditorDeposit.response.status !== 403) fail(`auditor deposit HTTP ${auditorDeposit.response.status}`);
  record("Auditor positive permission", "PASS", "GET /audits");
  record("Auditor mutation 403", "PASS", "POST deposit");

  await expectStatus("/admin/whoami", 200, admin, "admin whoami");
  const adminPortal = await call("/me", admin);
  if (adminPortal.response.status !== 403) fail(`admin customer portal HTTP ${adminPortal.response.status}`);
  record("Admin permission", "PASS", "GET /admin/whoami");
  record("Wrong role 403", "PASS");
  await expectStatus("/dashboard", 200, customer, "customer dashboard");
  await expectStatus("/dashboard", 200, teller, "teller dashboard");
  await expectStatus("/dashboard", 200, manager, "manager dashboard");
  await expectStatus("/dashboard", 200, auditor, "auditor dashboard");
  await expectStatus("/dashboard", 200, admin, "admin dashboard");
}

async function checkCors() {
  const evil = await request("/public/ready", { headers: { Origin: "https://evil.example" } });
  const evilAllow = evil.response.headers.get("access-control-allow-origin");
  if (evilAllow === "https://evil.example" || evilAllow === "*") fail("evil.example was allowed");
  if (allowOrigin) {
    const allowed = await request("/public/ready", { headers: { Origin: allowOrigin } });
    if (allowed.response.headers.get("access-control-allow-origin") !== allowOrigin) fail("configured origin was not allowed");
  } else if (envName !== "development") {
    fail("SPIKE_CORS_ALLOW is required outside development");
  }
  for (const origin of denyOrigins) {
    const denied = await request("/public/ready", { headers: { Origin: origin } });
    const header = denied.response.headers.get("access-control-allow-origin");
    if (header === origin || header === "*") fail(`${origin} was allowed`);
  }
  record("CORS isolation", "PASS");
}

async function checkLanguages() {
  if (!frontendUrl) {
    for (const language of ["EN", "ES", "FR"]) record(language, "SKIP", "FRONTEND_URL is not set");
    return;
  }
  const home = await expectStatus(frontendUrl, 200, null, "frontend");
  const scripts = [...home.text.matchAll(/src="([^"]+\.js)"/g)].map((match) => new URL(match[1], `${frontendUrl}/`).toString());
  let bundle = "";
  for (const scriptUrl of scripts) {
    const script = await request(scriptUrl);
    if (script.response.status === 200) bundle += script.text;
  }
  const phrases = { EN: "Account number", ES: "Número de cuenta", FR: "Numéro de compte" };
  for (const [language, phrase] of Object.entries(phrases)) {
    if (!bundle.includes(phrase)) fail(`${language} phrase was not in the frontend bundle`);
    record(`${language} bundle`, "PASS");
  }
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : "verify failed"}`);
  process.exit(1);
});
