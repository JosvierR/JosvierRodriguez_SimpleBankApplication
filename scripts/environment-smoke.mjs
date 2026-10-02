const expectedEnvironment = process.env.EXPECTED_ENVIRONMENT || "staging";
const expectedRevision = process.env.EXPECTED_REVISION || "";
const requireAdmin = process.env.REQUIRE_ADMIN !== "false";

const apiBase = (process.env.API_BASE_URL || process.env.STAGING_API_BASE_URL || "").replace(/\/$/, "");
const frontendUrl = (process.env.FRONTEND_URL || process.env.STAGING_FRONTEND_URL || "").replace(/\/$/, "");
const customerUsername = process.env.CUSTOMER_USERNAME || process.env.STAGING_CUSTOMER_USERNAME || "";
const customerPassword = process.env.CUSTOMER_PASSWORD || process.env.STAGING_CUSTOMER_PASSWORD || "";
const adminUsername = process.env.ADMIN_USERNAME || process.env.STAGING_ADMIN_USERNAME || "";
const adminPassword = process.env.ADMIN_PASSWORD || process.env.STAGING_ADMIN_PASSWORD || "";
const recipientAccountNumber = process.env.RECIPIENT_ACCOUNT_NUMBER || process.env.STAGING_RECIPIENT_ACCOUNT_NUMBER || "";

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function requireValue(name, value) {
  if (!value) {
    fail(`Missing ${name}`);
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  return { response, text };
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} did not return JSON`);
  }
}

function assertNoSecrets(text, label) {
  const lowered = text.toLowerCase();
  const forbidden = ["mongodb+srv://", "mongodb://", "jwt_secret", "bearer eyj"];
  for (const marker of forbidden) {
    if (lowered.includes(marker)) {
      fail(`${label} exposed a secret marker`);
    }
  }
}

async function expectStatus(url, status, label, headers) {
  const result = await request(url, { headers });
  if (result.response.status !== status) {
    fail(`${label} returned HTTP ${result.response.status}`);
  }
  return result;
}

async function login(username, password, label) {
  const result = await request(`${apiBase}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (result.response.status !== 200) {
    fail(`${label} login returned HTTP ${result.response.status}`);
  }
  const body = parseJson(result.text, `${label} login`);
  if (!body.token || body.tokenType !== "Bearer") {
    fail(`${label} login did not return a bearer token`);
  }
  return body.token;
}

async function authorized(token, path, status, label) {
  const result = await request(`${apiBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (result.response.status !== status) {
    fail(`${label} returned HTTP ${result.response.status}`);
  }
  return result;
}

async function main() {
  requireValue("API base URL", apiBase);
  requireValue("frontend URL", frontendUrl);
  requireValue("EXPECTED_REVISION", expectedRevision);
  requireValue("customer username", customerUsername);
  requireValue("customer password", customerPassword);
  if (requireAdmin) {
    requireValue("admin username", adminUsername);
    requireValue("admin password", adminPassword);
  }
  if (expectedEnvironment === "staging") {
    requireValue("recipient account number", recipientAccountNumber);
  }

  const health = await expectStatus(`${apiBase}/public/health`, 200, "liveness");
  const healthBody = parseJson(health.text, "liveness");
  assertNoSecrets(health.text, "liveness");
  if (healthBody.status !== "UP" || healthBody.environment !== expectedEnvironment) {
    fail(`liveness status=${healthBody.status} environment=${healthBody.environment}`);
  }
  console.log(`liveness HTTP 200 environment=${healthBody.environment}`);

  const ready = await expectStatus(`${apiBase}/public/ready`, 200, "readiness");
  const readyBody = parseJson(ready.text, "readiness");
  assertNoSecrets(ready.text, "readiness");
  if (readyBody.status !== "UP" || readyBody.environment !== expectedEnvironment || readyBody.revision !== expectedRevision) {
    fail(`readiness status=${readyBody.status} environment=${readyBody.environment} revision=${readyBody.revision}`);
  }
  console.log(`readiness HTTP 200 environment=${readyBody.environment} revision=${readyBody.revision}`);

  const config = await expectStatus(`${apiBase}/public/config`, 200, "public config");
  const configBody = parseJson(config.text, "public config");
  assertNoSecrets(config.text, "public config");
  if (configBody.environment !== expectedEnvironment || configBody.demoMode !== false) {
    fail(`public config environment=${configBody.environment} demoMode=${configBody.demoMode}`);
  }
  console.log("public config matches backend environment and demo mode is off");

  const frontendOrigin = new URL(frontendUrl).origin;
  const allowed = await request(`${apiBase}/public/ready`, { headers: { Origin: frontendOrigin } });
  if (allowed.response.headers.get("access-control-allow-origin") !== frontendOrigin) {
    fail("staging frontend origin was not allowed");
  }
  console.log("configured frontend origin is allowed");

  const rejected = await request(`${apiBase}/public/ready`, { headers: { Origin: "https://evil.example" } });
  const rejectedOrigin = rejected.response.headers.get("access-control-allow-origin");
  if (rejectedOrigin === "https://evil.example" || rejectedOrigin === "*") {
    fail("unknown origin was allowed");
  }
  console.log(`unknown origin rejected HTTP ${rejected.response.status}`);

  for (const path of ["/", "/login", "/app"]) {
    const page = await expectStatus(`${frontendUrl}${path}`, 200, `frontend ${path}`);
    if (!page.text.includes('id="root"')) {
      fail(`frontend ${path} is not the SPA shell`);
    }
  }
  console.log("frontend /, /login, and /app returned the SPA shell");

  const home = await expectStatus(frontendUrl, 200, "frontend home");
  const scriptPaths = [...home.text.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1]);
  if (scriptPaths.length === 0) {
    fail("frontend home did not reference a script");
  }
  let badgeShipped = false;
  for (const scriptPath of scriptPaths) {
    const scriptUrl = new URL(scriptPath, `${frontendUrl}/`).toString();
    const script = await expectStatus(scriptUrl, 200, "frontend script");
    if (script.text.includes("stagingBadge")) {
      badgeShipped = true;
      break;
    }
  }
  if (!badgeShipped) {
    fail("frontend bundle does not contain the staging badge");
  }
  console.log("staging badge is present and reads backend public config");

  const customerToken = await login(customerUsername, customerPassword, "customer");
  console.log("customer login HTTP 200");
  await authorized(customerToken, "/me", 200, "customer profile");
  console.log("customer /api/me HTTP 200");
  await authorized(customerToken, "/dashboard", 200, "customer dashboard");
  console.log("customer dashboard HTTP 200");
  const accounts = await authorized(customerToken, "/me/accounts", 200, "customer accounts");
  const accountList = parseJson(accounts.text, "customer accounts");
  if (!Array.isArray(accountList) || accountList.length === 0) {
    fail("customer has no accounts");
  }
  for (const account of accountList) {
    if (!/^\d{12}$/.test(account.accountNumber || "")) {
      fail("customer account number is not a 12-digit value");
    }
  }
  console.log(`customer accounts HTTP 200 count=${accountList.length}`);

  await authorized(customerToken, "/admin/whoami", 403, "customer admin denial");
  console.log("customer /api/admin/whoami HTTP 403");

  if (requireAdmin) {
    const adminToken = await login(adminUsername, adminPassword, "admin");
    console.log("admin login HTTP 200");
    const whoami = await authorized(adminToken, "/admin/whoami", 200, "admin whoami");
    const whoamiBody = parseJson(whoami.text, "admin whoami");
    if (whoamiBody.username !== adminUsername) {
      fail("admin whoami returned a different username");
    }
    console.log("admin /api/admin/whoami HTTP 200");

    if (recipientAccountNumber) {
      const directory = await authorized(adminToken, "/accounts", 200, "admin account directory");
      const directoryBody = parseJson(directory.text, "admin account directory");
      const foreign = Array.isArray(directoryBody)
        ? directoryBody.find((account) => account.accountNumber === recipientAccountNumber)
        : undefined;
      if (!foreign?.accountId) {
        fail("recipient account number was not found");
      }
      await authorized(customerToken, `/accounts/${foreign.accountId}`, 404, "foreign account read");
      await authorized(customerToken, `/accounts/${foreign.accountId}/transactions`, 404, "foreign history read");
      console.log("foreign account and history HTTP 404");
    }
  }

  if (recipientAccountNumber) {
    const source = accountList.find((account) => account.accountNumber !== recipientAccountNumber);
    if (!source?.accountId) {
      fail("sender has no account distinct from the recipient");
    }
    const preview = await request(`${apiBase}/me/transfers/preview`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${customerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceAccountId: source.accountId,
        destinationAccountNumber: recipientAccountNumber,
        amount: "1.00",
      }),
    });
    if (preview.response.status !== 200) {
      fail(`transfer preview returned HTTP ${preview.response.status}`);
    }
    const previewBody = parseJson(preview.text, "transfer preview");
    assertNoSecrets(preview.text, "transfer preview");
    const masked = previewBody.destinationAccountNumberMasked;
    if (!masked || masked === recipientAccountNumber || !masked.endsWith(recipientAccountNumber.slice(-4))) {
      fail("destination account number was not masked");
    }
    if (!previewBody.destinationDisplayName) {
      fail("transfer preview did not return a limited destination name");
    }
    for (const key of ["destinationAccountId", "destinationBalance", "destinationUserId", "history", "transactions"]) {
      if (Object.prototype.hasOwnProperty.call(previewBody, key)) {
        fail(`transfer preview exposed ${key}`);
      }
    }
    console.log(`transfer preview HTTP 200 destination=${masked}`);
  }

  console.log("staging smoke passed");
}

main().catch((error) => {
  if (!process.exitCode) {
    console.error(`FAIL ${error instanceof Error ? error.message : "smoke failed"}`);
    process.exit(1);
  }
});
