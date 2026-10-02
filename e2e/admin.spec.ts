import { expect, test } from '@playwright/test';
import { credential, signIn } from './support';

test('admin can open staff and security pages', async ({ page }) => {
  const username = credential('E2E_ADMIN_USERNAME');
  const password = credential('E2E_ADMIN_PASSWORD');
  await signIn(page, username, password);
  for (const path of ['/app/customers', '/app/accounts', '/app/audits', '/app/admin', '/app/admin/access', '/app/admin/security-audit']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Access denied' })).toHaveCount(0);
  }
});
