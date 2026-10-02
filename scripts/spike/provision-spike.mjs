import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { cents, formatCents } from "./money.mjs";

const apiBase = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const envName = process.env.ENV_NAME || "";
const adminUsername = process.env.SPIKE_ADMIN_USERNAME || "";
const adminPassword = process.env.SPIKE_ADMIN_PASSWORD || "";
const passwordFile = process.env.SPIKE_PASSWORDS_FILE || "";
const knownPostSpike = process.env.SPIKE_KNOWN_POST_SPIKE === "true";
const allowedEnvs = new Set(["development", "staging", "production"]);

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function requireValue(name, value) {
  if (!value) fail(`Missing ${name}`);
}

function loadManifest() {
  const file = new URL("./product-spike-manifest.json", import.meta.url);
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  if (manifest.version !== "product-spike-v1" || manifest.identities?.length !== 20) {
    fail("Spike manifest must be product-spike-v1 with 20 identities");
  }
  return manifest;
}

function loadPasswords() {
  requireValue("SPIKE_PASSWORDS_FILE", passwordFile);
  const absolute = resolve(passwordFile);
  const insideRepo = relative(process.cwd(), absolute);
  if (!insideRepo.startsWith("..")) fail("SPIKE_PASSWORDS_FILE must stay outside this repository");
  const parsed = JSON.parse(readFileSync(absolute, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("SPIKE_PASSWORDS_FILE must be a username-to-password object");
  }
  return parsed;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
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

function authHeaders(token, json = false) {
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
  if (result.response.status !== 200) fail(`Admin login returned HTTP ${result.response.status}`);
  const body = parseJson(result.text, "admin login");
  if (!body?.token) fail("Admin login did not return a token");
  return body.token;
}

function acceptedBalance(identity, plan, current, manifest) {
  const target = cents(plan.startingBalance);
  if (current === target) return true;
  if (!knownPostSpike) return false;
  const transfer = manifest.transfer;
  if (identity.key === transfer.sender && plan.type === transfer.senderAccount) {
    return current === target - cents(transfer.amount);
  }
  if (identity.key === transfer.recipient && plan.type === transfer.recipientAccount) {
    return current === target + cents(transfer.amount);
  }
  return false;
}

async function main() {
  requireValue("API_BASE_URL", apiBase);
  requireValue("ENV_NAME", envName);
  requireValue("SPIKE_ADMIN_USERNAME", adminUsername);
  requireValue("SPIKE_ADMIN_PASSWORD", adminPassword);
  if (!allowedEnvs.has(envName)) fail("ENV_NAME must be development, staging, or production");
  if (envName !== "development" && process.env.DEMO_SEED_ENABLED === "true") {
    fail("Refusing to provision with demo seed enabled");
  }

  const manifest = loadManifest();
  const passwords = loadPasswords();
  const config = await request("/public/config");
  const configBody = parseJson(config.text, "public config");
  if (config.response.status !== 200) fail(`Public config returned HTTP ${config.response.status}`);
  if ((envName === "staging" || envName === "production") && configBody.demoMode !== false) {
    fail("Refusing to provision while demo mode is enabled");
  }
  if (envName === "staging" && configBody.environment !== "staging") fail("API environment is not staging");
  if (envName === "production" && configBody.environment !== "production") fail("API environment is not production");

  const token = await login(adminUsername, adminPassword);
  let authUsers = await listAuthUsers(token);
  let bankUsers = await listBankUsers(token);

  for (const identity of manifest.identities) {
    const password = passwords[identity.username];
    if (!password) fail(`Missing password entry for ${identity.username}`);
    let authUser = authUsers.find((user) => user.username === identity.username);
    if (!authUser) {
      const registered = await request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identity.username, email: identity.email, password }),
      });
      if (registered.response.status !== 201 && registered.response.status !== 409) {
        fail(`Register ${identity.username} returned HTTP ${registered.response.status}`);
      }
      authUsers = await listAuthUsers(token);
      authUser = authUsers.find((user) => user.username === identity.username);
      if (!authUser) fail(`Registered user ${identity.username} was not listed`);
      console.log(`identity ${identity.username} created=${registered.response.status === 201}`);
    } else {
      console.log(`identity ${identity.username} already present`);
    }

    if (authUser.email?.toLowerCase() !== identity.email.toLowerCase()) {
      fail(`Username ${identity.username} is bound to a different email`);
    }
    if (authUser.role !== identity.role) {
      const updated = await request(`/admin/auth-users/${authUser.id}/role`, {
        method: "PUT",
        headers: authHeaders(token, true),
        body: JSON.stringify({ role: identity.role }),
      });
      if (updated.response.status !== 200) fail(`Role update for ${identity.username} returned HTTP ${updated.response.status}`);
      authUser = parseJson(updated.text, "role update");
      console.log(`identity ${identity.username} role reconciled to ${identity.role}`);
    }
    if (identity.kind === "staff") {
      if (authUser.bankUserId) fail(`Staff user ${identity.username} is linked to a bank customer`);
      continue;
    }

    let bankUser = bankUsers.find((user) => user.email?.toLowerCase() === identity.email.toLowerCase());
    if (bankUser && bankUser.name !== identity.displayName) {
      fail(`Bank profile for ${identity.username} has a different display name`);
    }
    if (!bankUser) {
      const created = await request("/users", {
        method: "POST",
        headers: authHeaders(token, true),
        body: JSON.stringify({ name: identity.displayName, email: identity.email }),
      });
      if (created.response.status === 409) {
        bankUsers = await listBankUsers(token);
        bankUser = bankUsers.find((user) => user.email?.toLowerCase() === identity.email.toLowerCase());
      } else if (created.response.status === 201) {
        bankUser = parseJson(created.text, "bank user");
        bankUsers.push(bankUser);
      } else {
        fail(`Bank profile for ${identity.username} returned HTTP ${created.response.status}`);
      }
    }
    if (!bankUser?.id) fail(`Bank profile for ${identity.username} was not found`);
    if (!authUser.bankUserId) {
      const linked = await request(`/admin/auth-users/${authUser.id}/customer-link`, {
        method: "PUT",
        headers: authHeaders(token, true),
        body: JSON.stringify({ bankUserId: bankUser.id }),
      });
      if (linked.response.status !== 200) fail(`Customer link for ${identity.username} returned HTTP ${linked.response.status}`);
      console.log(`identity ${identity.username} linked`);
    } else if (authUser.bankUserId !== bankUser.id) {
      fail(`Customer ${identity.username} is linked to a different bank profile`);
    }

    const accountsResult = await request(`/users/${bankUser.id}/accounts`, { headers: authHeaders(token) });
    if (accountsResult.response.status !== 200) fail(`Accounts for ${identity.username} returned HTTP ${accountsResult.response.status}`);
    const accounts = parseJson(accountsResult.text, "accounts");
    for (const plan of identity.accounts) {
      const existing = accounts.filter((account) => account.accountType === plan.type);
      if (existing.length > 1) fail(`Customer ${identity.username} has duplicate ${plan.type} accounts`);
      let account = existing[0];
      if (!account) {
        const opened = await request("/accounts", {
          method: "POST",
          headers: authHeaders(token, true),
          body: JSON.stringify({ userId: bankUser.id, accountType: plan.type }),
        });
        if (opened.response.status !== 201) fail(`Open ${plan.type} for ${identity.username} returned HTTP ${opened.response.status}`);
        account = parseJson(opened.text, "open account");
        accounts.push(account);
        const funded = await request(`/accounts/${account.accountId}/deposit`, {
          method: "POST",
          headers: authHeaders(token, true),
          body: JSON.stringify({ amount: plan.startingBalance }),
        });
        if (funded.response.status !== 200) fail(`Fund ${plan.type} for ${identity.username} returned HTTP ${funded.response.status}`);
        const fundedBody = parseJson(funded.text, "fund account");
        if (cents(fundedBody.balance) !== cents(plan.startingBalance)) {
          fail(`Funded ${identity.username} ${plan.type} balance was ${formatCents(cents(fundedBody.balance))}`);
        }
        console.log(`identity ${identity.username} ${plan.type} opened at target`);
        continue;
      }
      const current = cents(account.balance);
      if (current === 0n) {
        const funded = await request(`/accounts/${account.accountId}/deposit`, {
          method: "POST",
          headers: authHeaders(token, true),
          body: JSON.stringify({ amount: plan.startingBalance }),
        });
        if (funded.response.status !== 200) fail(`Fund ${plan.type} for ${identity.username} returned HTTP ${funded.response.status}`);
        console.log(`identity ${identity.username} ${plan.type} funded to starting target`);
        continue;
      }
      if (!acceptedBalance(identity, plan, current, manifest)) {
        fail(`Balance mismatch for ${identity.username} ${plan.type}: found ${formatCents(current)}, target ${plan.startingBalance}`);
      }
      console.log(`identity ${identity.username} ${plan.type} balance left unchanged`);
    }
  }

  console.log(`spike provision complete env=${envName} identities=${manifest.identities.length}`);
}

async function listAuthUsers(token) {
  const result = await request("/admin/auth-users", { headers: authHeaders(token) });
  if (result.response.status !== 200) fail(`Auth user list returned HTTP ${result.response.status}`);
  const body = parseJson(result.text, "auth users");
  if (!Array.isArray(body)) fail("Auth user list was not an array");
  return body;
}

async function listBankUsers(token) {
  const result = await request("/users", { headers: authHeaders(token) });
  if (result.response.status !== 200) fail(`Bank user list returned HTTP ${result.response.status}`);
  const body = parseJson(result.text, "bank users");
  if (!Array.isArray(body)) fail("Bank user list was not an array");
  return body;
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : "provision failed"}`);
  process.exit(1);
});
