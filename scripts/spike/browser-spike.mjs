import { mkdirSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { chromium } from "playwright";

const frontendUrl = (process.env.FRONTEND_URL || "").replace(/\/$/, "");
const apiBase = (process.env.API_BASE_URL || "").replace(/\/$/, "");
const envName = process.env.ENV_NAME || "";
const passwordFile = process.env.SPIKE_PASSWORDS_FILE || "";
const screenshotDir = resolve(process.env.SPIKE_SCREENSHOT_DIR || "docs/screenshots/cross-environment-spike");
const responsive = process.env.SPIKE_BROWSER_RESPONSIVE === "true";
const captureLedger = process.env.SPIKE_CAPTURE_LEDGER === "true";
const allowed = new Set(["development", "staging", "production"]);
const widths = [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
];

function fail(message) {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

function record(name, status, detail = "") {
  console.log(`RESULT ${name} ${status}${detail ? ` ${detail}` : ""}`);
}

function requireValue(name, value) {
  if (!value) fail(`Missing ${name}`);
}

function loadJson(url) {
  return JSON.parse(readFileSync(url, "utf8"));
}

async function api(path, token, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body) headers["Content-Type"] = "application/json";
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const text = await response.text();
  if (response.status !== (options.expect || 200)) fail(`${path} HTTP ${response.status}`);
  return text ? JSON.parse(text) : null;
}

async function tokenFor(username, passwords) {
  const body = await api("/auth/login", null, {
    method: "POST",
    body: JSON.stringify({ username, password: passwords[username] }),
  });
  if (!body?.token) fail(`${username} login did not return a token`);
  return body.token;
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) fail(`horizontal overflow ${overflow}px at ${page.viewportSize()?.width}`);
}

async function login(page, username, password) {
  await page.goto(`${frontendUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => sessionStorage.clear());
  await page.goto(`${frontendUrl}/login`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "English" }).click();
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/app/, { timeout: 20000 });
  await page.locator("h1").first().waitFor();
}

async function switchLanguage(page, language, phrase) {
  await page.getByRole("button", { name: language }).click();
  await page.getByText(phrase, { exact: false }).first().waitFor({ timeout: 10000 });
}

async function shot(page, name) {
  mkdirSync(screenshotDir, { recursive: true });
  await page.screenshot({ path: resolve(screenshotDir, name), fullPage: true });
  console.log(`SHOT ${name}`);
}

async function main() {
  requireValue("FRONTEND_URL", frontendUrl);
  requireValue("API_BASE_URL", apiBase);
  requireValue("ENV_NAME", envName);
  requireValue("SPIKE_PASSWORDS_FILE", passwordFile);
  if (!allowed.has(envName)) fail("ENV_NAME must be development, staging, or production");
  const absolutePasswords = resolve(passwordFile);
  if (!relative(process.cwd(), absolutePasswords).startsWith("..")) fail("SPIKE_PASSWORDS_FILE must stay outside this repository");
  const manifest = loadJson(new URL("./product-spike-manifest.json", import.meta.url));
  const passwords = loadJson(absolutePasswords);
  const names = {
    development: { dashboard: "01-dev-dashboard.png", admin: "04-dev-admin.png" },
    staging: {
      dashboard: "02-staging-dashboard.png",
      admin: "05-staging-admin.png",
      teller: "07-staging-teller.png",
      manager: "09-staging-manager.png",
      auditor: "11-staging-auditor.png",
      preview: "13-staging-transfer-preview.png",
      ledger: "15-staging-transfer-ledger.png",
      mobile: "19-staging-mobile-390.png",
    },
    production: {
      dashboard: "03-production-dashboard.png",
      admin: "06-production-admin.png",
      teller: "08-production-teller.png",
      manager: "10-production-manager.png",
      auditor: "12-production-auditor.png",
      preview: "14-production-transfer-preview.png",
      ledger: "16-production-transfer-ledger.png",
      mobile: "20-production-mobile-390.png",
      ready: "17-production-ready.png",
      actions: "18-production-actions-green.png",
    },
  }[envName];

  const sender = manifest.identities.find((identity) => identity.key === manifest.transfer.sender);
  const recipient = manifest.identities.find((identity) => identity.key === manifest.transfer.recipient);
  const senderToken = await tokenFor(sender.username, passwords);
  const senderAccounts = await api("/me/accounts", senderToken);
  const checking = senderAccounts.find((account) => account.accountType === "CHECKING");
  const adminToken = await tokenFor("ava.admin", passwords);
  const directory = await api("/accounts", adminToken);
  const recipientAccount = directory.find((account) => account.userName === recipient.displayName && account.accountType === "CHECKING");
  if (!checking?.accountNumber || !recipientAccount?.accountNumber) fail("Could not resolve the controlled accounts");

  const forbidden = [];
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (error) => forbidden.push(`pageerror ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") forbidden.push(`console ${message.text()}`);
  });
  page.on("request", (request) => {
    const url = request.url();
    if (envName !== "development" && /localhost|127\.0\.0\.1/.test(url)) forbidden.push(`localhost ${url}`);
    if (envName === "production" && url.includes("simple-bank-api-staging.onrender.com")) forbidden.push(`staging api ${url}`);
    if (envName === "staging" && url.includes("simple-bank-api-production.onrender.com")) forbidden.push(`production api ${url}`);
  });

  await page.goto(`${frontendUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /sign in/i }).first().waitFor();
  record("Landing", "PASS");

  await login(page, sender.username, passwords[sender.username]);
  await page.getByText("Total balance", { exact: false }).first().waitFor();
  await assertNoOverflow(page);
  await shot(page, names.dashboard);
  await page.goto(`${frontendUrl}/app/my-accounts`, { waitUntil: "networkidle" });
  await page.getByText(checking.accountNumber).first().waitFor();
  await page.goto(`${frontendUrl}/app/my-accounts/${checking.accountId}`, { waitUntil: "networkidle" });
  await page.getByText(checking.accountNumber).first().waitFor();
  record("Customer pages", "PASS");

  await page.goto(`${frontendUrl}/app/my-transfer`, { waitUntil: "networkidle" });
  await page.locator("select").first().selectOption({ label: new RegExp(checking.accountNumber) }).catch(async () => {
    const option = page.locator("option", { hasText: checking.accountNumber });
    await page.locator("select").first().selectOption(await option.getAttribute("value"));
  });
  await page.getByText("Another Simple Bank account", { exact: false }).click();
  await page.locator('input[inputmode="numeric"]').fill(recipientAccount.accountNumber);
  await page.locator("#customer-transfer-amount").fill("1.00");
  await page.getByRole("button", { name: "Preview transfer" }).click();
  await page.getByText(recipientAccount.accountNumber.slice(-4)).first().waitFor();
  const previewText = await page.locator("body").innerText();
  if (previewText.includes(recipientAccount.accountNumber)) fail("preview showed the full foreign account number");
  if (names.preview) await shot(page, names.preview);
  record("Transfer preview", "PASS");

  if (captureLedger && names.ledger) {
    await page.goto(`${frontendUrl}/app/my-accounts/${checking.accountId}/transactions`, { waitUntil: "networkidle" });
    await page.getByText("TRANSFER", { exact: false }).first().waitFor();
    await shot(page, names.ledger);
    record("Ledger page", "PASS");
  }

  await switchLanguage(page, "Español", "Saldo total");
  record("ES browser", "PASS");
  await switchLanguage(page, "Français", "Solde total");
  record("FR browser", "PASS");
  await switchLanguage(page, "English", "Total balance");
  record("EN browser", "PASS");

  const staff = [
    ["ava.admin", "/app/admin", names.admin],
    ["mia.teller", "/app/customers", names.teller],
    ["marcus.manager", "/app/accounts", names.manager],
    ["leo.auditor", "/app/audits", names.auditor],
  ];
  for (const [username, path, file] of staff) {
    if (!file) continue;
    await login(page, username, passwords[username]);
    await page.goto(`${frontendUrl}${path}`, { waitUntil: "networkidle" });
    await page.locator("h1").first().waitFor();
    await assertNoOverflow(page);
    await shot(page, file);
    record(`${username} browser`, "PASS");
  }

  if (responsive) {
    for (const viewport of widths) {
      await page.setViewportSize(viewport);
      await login(page, sender.username, passwords[sender.username]);
      await page.goto(`${frontendUrl}/app/my-accounts`, { waitUntil: "networkidle" });
      await page.getByText(checking.accountNumber).first().waitFor();
      if (viewport.width < 800) {
        const menu = page.locator(".mobile-menu");
        if (await menu.isVisible()) await menu.click();
        await page.locator(".mobile-sheet nav, .sidebar nav").first().waitFor();
        if (await page.locator(".sidebar__close").isVisible()) await page.locator(".sidebar__close").click();
      }
      await assertNoOverflow(page);
      if (viewport.width === 390 && names.mobile) await shot(page, names.mobile);
    }
    record("Responsive", "PASS", widths.map((viewport) => viewport.width).join(","));
  }

  if (envName === "production") {
    await page.goto("https://simple-bank-api-production.onrender.com/api/public/ready", { waitUntil: "networkidle" });
    await shot(page, names.ready);
    await page.goto("https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/actions/runs/36960935729", { waitUntil: "networkidle" });
    await shot(page, names.actions);
    record("Production evidence pages", "PASS");
  }

  await browser.close();
  const critical = forbidden.filter((item) => !/favicon|Failed to load resource/i.test(item));
  if (critical.length > 0) fail(critical.slice(0, 5).join(" | "));
  record("Console", "PASS");
  console.log(`browser spike complete env=${envName}`);
}

main().catch((error) => {
  console.error(`FAIL ${error instanceof Error ? error.message : "browser spike failed"}`);
  process.exit(1);
});
