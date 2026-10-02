import { expect, test } from '@playwright/test';
import { credential, signIn } from './support';

test('customer can see the dashboard, accounts, and profile', async ({ page }) => {
  const username = credential('E2E_CUSTOMER_USERNAME');
  const password = credential('E2E_CUSTOMER_PASSWORD');
  await signIn(page, username, password);
  await expect(page).toHaveURL(/\/app/);
  await page.goto('/app/my-accounts');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toHaveCount(0);
  await page.goto('/app/profile');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toHaveCount(0);
});

test('customer cannot open the admin route', async ({ page }) => {
  const username = credential('E2E_CUSTOMER_USERNAME');
  const password = credential('E2E_CUSTOMER_PASSWORD');
  await signIn(page, username, password);
  await page.goto('/app/admin');
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible();
});
