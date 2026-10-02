import { expect, test } from '@playwright/test';
import { apiBase, credential, loginToken } from './support';

test('isolated deposit and withdraw round trip @mutation', async ({ request }) => {
  test.skip(process.env.E2E_ALLOW_MUTATION !== 'true', 'Set E2E_ALLOW_MUTATION=true for a dedicated synthetic account');
  const accountId = process.env.E2E_MUTATION_ACCOUNT_ID;
  test.skip(!accountId, 'E2E_MUTATION_ACCOUNT_ID is required');
  const username = credential('E2E_ADMIN_USERNAME');
  const password = credential('E2E_ADMIN_PASSWORD');
  const token = await loginToken(request, username, password);
  const headers = { Authorization: `Bearer ${token}` };
  const before = await request.get(`${apiBase()}/accounts/${accountId}`, { headers });
  expect(before.status()).toBe(200);
  const starting = Number((await before.json()).balance);
  const deposit = await request.post(`${apiBase()}/accounts/${accountId}/deposit`, {
    headers,
    data: { amount: '0.01' },
  });
  expect(deposit.status()).toBe(200);
  const deposited = Number((await deposit.json()).balance);
  expect(deposited).toBeCloseTo(starting + 0.01, 2);
  const withdraw = await request.post(`${apiBase()}/accounts/${accountId}/withdraw`, {
    headers,
    data: { amount: '0.01' },
  });
  expect(withdraw.status()).toBe(200);
  const restored = Number((await withdraw.json()).balance);
  expect(restored).toBeCloseTo(starting, 2);
  const history = await request.get(`${apiBase()}/accounts/${accountId}/transactions`, { headers });
  expect(history.status()).toBe(200);
  const transactions = (await history.json()) as Array<{ type?: string; amount?: string }>;
  expect(transactions.length).toBeGreaterThan(0);
});
