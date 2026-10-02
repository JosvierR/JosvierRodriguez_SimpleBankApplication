import { expect, test } from '@playwright/test';
import { credential, signIn } from './support';

test('invalid login is rejected', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[autocomplete="username"]').fill('missing-user');
  await page.locator('input[type="password"]').fill('not-a-real-password');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test('valid customer login and logout work', async ({ page }) => {
  const username = credential('E2E_CUSTOMER_USERNAME');
  const password = credential('E2E_CUSTOMER_PASSWORD');
  await signIn(page, username, password);
  await page.getByRole('button', { name: /log out/i }).click();
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login/);
});

test('a protected route redirects when signed out', async ({ page }) => {
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login/);
});
