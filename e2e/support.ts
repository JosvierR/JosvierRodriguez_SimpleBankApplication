import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

export function apiBase(): string {
  const configured = process.env.E2E_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }
  const web = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
  return `${web}/api`;
}

export function credential(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (process.env.E2E_REQUIRE_AUTH === 'true') {
      throw new Error(`${name} is required`);
    }
    test.skip(true, `${name} is not set`);
  }
  return value as string;
}

export async function signIn(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.locator('input[autocomplete="username"]').fill(username);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/app/);
}

export async function loginToken(request: APIRequestContext, username: string, password: string): Promise<string> {
  const response = await request.post(`${apiBase()}/auth/login`, {
    data: { username, password },
  });
  expect(response.status()).toBe(200);
  const body = (await response.json()) as { token: string };
  expect(body.token).toBeTruthy();
  return body.token;
}
