import { expect, test } from '@playwright/test';
import { apiBase, credential, loginToken } from './support';

test('banking mutations stay off unless a dedicated account is configured @mutation', async ({ request }) => {
  test.skip(process.env.E2E_ALLOW_MUTATION !== 'true', 'Set E2E_ALLOW_MUTATION=true only for an isolated test account');
  const accountId = process.env.E2E_MUTATION_ACCOUNT_ID;
  test.skip(!accountId, 'E2E_MUTATION_ACCOUNT_ID is required');
  const username = credential('E2E_CUSTOMER_USERNAME');
  const password = credential('E2E_CUSTOMER_PASSWORD');
  const token = await loginToken(request, username, password);
  const history = await request.get(`${apiBase()}/me/accounts/${accountId}/transactions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(history.status()).toBe(200);
});
