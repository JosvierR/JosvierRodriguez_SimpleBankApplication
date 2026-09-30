import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { auditsApi } from '@/features/audits/api/auditsApi';
import { account, customer, renderRoute } from '@/test/render';
import { AuditsPage } from '@/features/audits/pages/AuditsPage';

describe('AuditsPage', () => {
  it('distinguishes bank customer, authenticated actor, and legacy null actor', async () => {
    vi.spyOn(auditsApi, 'list').mockResolvedValue([
      {
        id: 'a1',
        action: 'DEPOSIT',
        userId: customer.id,
        userName: customer.name,
        accountIds: [account.accountId],
        involvedUserIds: [customer.id],
        amount: 50,
        transactionIds: ['tx1'],
        createdAt: account.createdAt,
        actorAuthUserId: 'auth-1',
        actorUsername: 'operator',
      },
      {
        id: 'a2',
        action: 'WITHDRAW',
        userId: 'u2',
        userName: 'Legacy Customer',
        accountIds: ['acc-2'],
        involvedUserIds: ['u2'],
        amount: 10,
        transactionIds: ['tx2'],
        createdAt: account.createdAt,
        actorAuthUserId: null,
        actorUsername: null,
      },
    ]);
    renderRoute(<AuditsPage />);
    expect(await screen.findByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('operator')).toBeInTheDocument();
    expect(screen.getByText('Legacy / unavailable')).toBeInTheDocument();
    expect(screen.queryByText('Unknown actor')).not.toBeInTheDocument();
  });
});
