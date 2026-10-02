import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

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
  return JSON.parse(readFileSync(file, "utf8"));
}

function loadPasswords() {
  requireValue("SPIKE_PASSWORDS_FILE", passwordFile);
  const absolute = resolve(passwordFile);
  const insideRepo = relative(process.cwd(), absolute);
  if (!insideRepo.startsWith("..")) fail("SPIKE_PASSWORDS_FILE must stay outside this repository");
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

function bearer(token, json = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

async function expectStatus(path, status, token, label) {
  const result = await request(path, { headers: token ? bearer(token) : undefined });
  if (result.response.status !== status) fail(`${label} HTTP ${result.response.status}`);
  return result;
}

function money(value) {
  return Number(value).toFixed(2);
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
  if (!sender || !recipient) fail("Transfer identities are missing from the manifest");

  const health = await expectStatus("/public/health", 200, null, "health");
  const healthBody = parseJson(health.text, "health");
  assertNoSecrets(health.text, "health");
  if (healthBody.status !== "UP") fail("health is not UP");
  record("Health", "PASS", healthBody.environment);

  const ready = await expectStatus("/public/ready", 200, null, "ready");
  const readyBody = parseJson(ready.text, "ready");
  assertNoSecrets(ready.text, "ready");
  if (readyBody.status !== "UP") fail("ready is not UP");

  const config = await expectStatus("/public/config", 200, null, "config");
  const configBody = parseJson(config.text, "config");
  assertNoSecrets(config.text, "config");
  if (envName !== "development" && (configBody.environment !== envName || configBody.demoMode !== false)) {
    fail(`config environment=${configBody.environment} demoMode=${configBody.demoMode}`);
  }
  if (envName === "development" && !["local", "demo"].includes(configBody.environment)) {
    fail(`development config environment=${configBody.environment}`);
  }
  if (readyBody.environment !== configBody.environment) fail("ready and config environments differ");
  record("Config", "PASS", configBody.environment);

  const tokens = {};
  for (const identity of manifest.identities) {
    tokens[identity.username] = await login(identity.username, passwords[identity.username]);
  }
  record("Customer login", "PASS", sender.username);

  for (const role of ["TELLER", "MANAGER", "AUDITOR", "ADMIN"]) {
    const identity = byRole[role];
    const whoami = await request("/admin/whoami", { headers: bearer(tokens[identity.username]) });
    const expected = role === "ADMIN" ? 200 : 403;
    if (whoami.response.status !== expected) fail(`${role} whoami HTTP ${whoami.response.status}`);
    const dashboard = await expectStatus("/dashboard", 200, tokens[identity.username], `${role} dashboard`);
    assertNoSecrets(dashboard.text, `${role} dashboard`);
    record(`${role} RBAC`, "PASS");
  }
  record("Dashboard", "PASS");

  const senderToken = tokens[sender.username];
  const senderAccounts = parseJson((await expectStatus("/me/accounts", 200, senderToken, "sender accounts")).text, "sender accounts");
  const recipientAccounts = parseJson((await expectStatus("/me/accounts", 200, tokens[recipient.username], "recipient accounts")).text, "recipient accounts");
  const senderAccount = senderAccounts.find((account) => account.accountType === manifest.transfer.senderAccount);
  const recipientAccount = recipientAccounts.find((account) => account.accountType === manifest.transfer.recipientAccount);
  if (!/^\d{12}$/.test(senderAccount?.accountNumber || "") || !/^\d{12}$/.test(recipientAccount?.accountNumber || "")) {
    fail("Transfer accounts are missing a 12-digit number");
  }
  record("Own accounts", "PASS");

  const foreign = await request(`/accounts/${recipientAccount.accountId}`, { headers: bearer(senderToken) });
  const foreignHistory = await request(`/accounts/${recipientAccount.accountId}/transactions`, { headers: bearer(senderToken) });
  if (foreign.response.status !== 404 || foreignHistory.response.status !== 404) {
    fail(`foreign read HTTP ${foreign.response.status}/${foreignHistory.response.status}`);
  }
  record("Ownership 404", "PASS");

  const auditor = byRole.AUDITOR;
  const deniedDeposit = await request(`/accounts/${senderAccount.accountId}/deposit`, {
    method: "POST",
    headers: bearer(tokens[auditor.username], true),
    body: JSON.stringify({ amount: "1.00" }),
  });
  if (deniedDeposit.response.status !== 403) fail(`auditor deposit HTTP ${deniedDeposit.response.status}`);
  record("Wrong role 403", "PASS");

  const invalid = await request("/me", { headers: { Authorization: "Bearer not-a-jwt" } });
  if (invalid.response.status !== 401) fail(`invalid JWT HTTP ${invalid.response.status}`);
  record("Invalid JWT 401", "PASS");

  if (allowMutation) {
    const teller = byRole.TELLER;
    const beforeSender = money(senderAccount.balance);
    const beforeRecipient = money(recipientAccount.balance);
    const deposited = await request(`/accounts/${senderAccount.accountId}/deposit`, {
      method: "POST",
      headers: bearer(tokens[teller.username], true),
      body: JSON.stringify({ amount: "1.00" }),
    });
    if (deposited.response.status !== 200) fail(`deposit HTTP ${deposited.response.status}`);
    record("Deposit", "PASS");
    const withdrawn = await request(`/accounts/${senderAccount.accountId}/withdraw`, {
      method: "POST",
      headers: bearer(tokens[teller.username], true),
      body: JSON.stringify({ amount: "1.00" }),
    });
    if (withdrawn.response.status !== 200) fail(`withdraw HTTP ${withdrawn.response.status}`);
    record("Withdraw", "PASS");

    const preview = await request("/me/transfers/preview", {
      method: "POST",
      headers: bearer(senderToken, true),
      body: JSON.stringify({
        sourceAccountId: senderAccount.accountId,
        destinationAccountNumber: recipientAccount.accountNumber,
        amount: manifest.transfer.amount,
      }),
    });
    if (preview.response.status !== 200) fail(`preview HTTP ${preview.response.status}`);
    record("Transfer preview", "PASS");

    const submitted = await request("/me/transfers", {
      method: "POST",
      headers: bearer(senderToken, true),
      body: JSON.stringify({
        sourceAccountId: senderAccount.accountId,
        destinationAccountNumber: recipientAccount.accountNumber,
        amount: manifest.transfer.amount,
      }),
    });
    if (submitted.response.status !== 200) fail(`transfer HTTP ${submitted.response.status}`);
    const receipt = parseJson(submitted.text, "transfer");
    const afterSender = parseJson((await expectStatus("/me/accounts", 200, senderToken, "sender after")).text, "sender after")
      .find((account) => account.accountId === senderAccount.accountId);
    const afterRecipient = parseJson((await expectStatus("/me/accounts", 200, tokens[recipient.username], "recipient after")).text, "recipient after")
      .find((account) => account.accountId === recipientAccount.accountId);
    if (money(afterSender.balance) !== money(Number(beforeSender) - 1) || money(afterRecipient.balance) !== money(Number(beforeRecipient) + 1)) {
      fail("transfer balances did not move by 1.00");
    }
    record("Transfer submit", "PASS", receipt.transferReference);
    const senderHistory = parseJson((await expectStatus(`/me/accounts/${senderAccount.accountId}/transactions`, 200, senderToken, "sender history")).text, "sender history");
    const recipientHistory = parseJson((await expectStatus(`/me/accounts/${recipientAccount.accountId}/transactions`, 200, tokens[recipient.username], "recipient history")).text, "recipient history");
    const outRow = senderHistory.find((row) => row.transferReference === receipt.transferReference && row.type === "TRANSFER_OUT");
    const inRow = recipientHistory.find((row) => row.transferReference === receipt.transferReference && row.type === "TRANSFER_IN");
    if (!outRow || !inRow) fail("ledger pair was not found");
    const stillForeign = await request(`/accounts/${recipientAccount.accountId}`, { headers: bearer(senderToken) });
    if (stillForeign.response.status !== 404) fail("foreign account became readable");
    record("Ledger pair", "PASS", receipt.transferReference);
  } else {
    const preview = await request("/me/transfers/preview", {
      method: "POST",
      headers: bearer(senderToken, true),
      body: JSON.stringify({
        sourceAccountId: senderAccount.accountId,
        destinationAccountNumber: recipientAccount.accountNumber,
        amount: manifest.transfer.amount,
      }),
    });
    if (preview.response.status !== 200) fail(`preview HTTP ${preview.response.status}`);
    record("Transfer preview", "PASS");
    for (const name of ["Deposit", "Withdraw", "Transfer submit", "Ledger pair"]) {
      record(name, "SKIP", "ALLOW_SPIKE_MUTATION is not true");
    }
  }

  await checkCors();
  await checkLanguages();
  const failed = results.filter((result) => result.status === "FAIL");
  if (failed.length > 0) process.exit(1);
  console.log(`spike verify complete env=${envName}`);
}

async function checkCors() {
  const evil = await request("/public/ready", { headers: { Origin: "https://evil.example" } });
  const evilAllow = evil.response.headers.get("access-control-allow-origin");
  if (evilAllow === "https://evil.example" || evilAllow === "*") fail("evil.example was allowed");
  if (allowOrigin) {
    const allowed = await request("/public/ready", { headers: { Origin: allowOrigin } });
    if (allowed.response.headers.get("access-control-allow-origin") !== allowOrigin) {
      fail("configured origin was not allowed");
    }
  }
  for (const origin of denyOrigins) {
    const denied = await request("/public/ready", { headers: { Origin: origin } });
    const header = denied.response.headers.get("access-control-allow-origin");
    if (header === origin || header === "*") fail(`${origin} was allowed`);
  }
  if (!allowOrigin && envName !== "development") fail("SPIKE_CORS_ALLOW is required outside development");
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
  const phrases = {
    EN: "Account number",
    ES: "Número de cuenta",
    FR: "Numéro de compte",
  };
  for (const [language, phrase] of Object.entries(phrases)) {
    if (!bundle.includes(phrase)) fail(`${language} phrase was not in the frontend bundle`);
    record(language, "PASS");
  }
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : "verify failed"}`);
  process.exit(1);
});
