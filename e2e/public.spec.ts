import { expect, test } from '@playwright/test';
import { apiBase } from './support';

test('home page responds @readonly', async ({ page }) => {
  const response = await page.goto('/');
  expect(response?.ok()).toBeTruthy();
});

test('login route is available @readonly', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
});

test('register route is available @readonly', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('form')).toBeVisible();
});

test('health is up @readonly', async ({ request }) => {
  const response = await request.get(`${apiBase()}/public/health`);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string };
  expect(body.status).toBe('UP');
});

test('ready is up @readonly', async ({ request }) => {
  const response = await request.get(`${apiBase()}/public/ready`);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { status: string; environment: string; revision: string };
  expect(body.status).toBe('UP');
  expect(body.environment).toBeTruthy();
  expect(body.revision).toBeTruthy();
  if (process.env.E2E_EXPECTED_REVISION) {
    expect(body.revision).toBe(process.env.E2E_EXPECTED_REVISION);
  }
  if (process.env.E2E_EXPECTED_ENVIRONMENT) {
    expect(body.environment).toBe(process.env.E2E_EXPECTED_ENVIRONMENT);
  }
});

test('public config hides demo mode outside the demo profile @readonly', async ({ request }) => {
  const response = await request.get(`${apiBase()}/public/config`);
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { demoMode: boolean; environment: string };
  expect(typeof body.demoMode).toBe('boolean');
  if (body.environment === 'production' || body.environment === 'staging') {
    expect(body.demoMode).toBe(false);
  }
});
