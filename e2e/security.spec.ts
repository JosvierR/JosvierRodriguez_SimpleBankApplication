import { expect, test } from '@playwright/test';
import { apiBase, credential, loginToken } from './support';

test('an unauthenticated caller cannot read protected data @readonly', async ({ request }) => {
  const response = await request.get(`${apiBase()}/me`);
  expect(response.status()).toBe(401);
});

test('a wrong password is rejected @readonly', async ({ request }) => {
  const response = await request.post(`${apiBase()}/auth/login`, {
    data: { username: 'missing-user', password: 'not-a-real-password' },
  });
  expect(response.status()).toBe(401);
});

test('a customer token cannot call the admin API', async ({ request }) => {
  const username = credential('E2E_CUSTOMER_USERNAME');
  const password = credential('E2E_CUSTOMER_PASSWORD');
  const token = await loginToken(request, username, password);
  const response = await request.get(`${apiBase()}/admin/whoami`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.status()).toBe(403);
});
