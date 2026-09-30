import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { ApiError } from '@/shared/api/client';
import { account, renderRoute } from '@/test/render';
import { TransferPage } from '@/features/transfers/pages/TransferPage';

const second = { ...account, accountId: 'acc-202', userId: 'user-2', userName: 'Grace Hopper', balance: 100 };

describe('TransferPage', () => {
  it('submits a transfer and renders both new balances and audit id', async () => {
    vi.spyOn(accountsApi, 'list').mockResolvedValue([account, second]);
    const transfer = vi.spyOn(accountsApi, 'transfer').mockResolvedValue({
      fromAccountId: account.accountId,
      toAccountId: second.accountId,
      amount: 100,
      fromBalance: 450,
      toBalance: 200,
      auditId: 'audit-22',
      createdAt: account.createdAt,
    });
    renderRoute(<TransferPage />);
    const user = userEvent.setup();
    await screen.findAllByRole('option', { name: /Ada Lovelace/ });
    await user.selectOptions(screen.getByLabelText('From account'), account.accountId);
    await user.selectOptions(screen.getByLabelText('To account'), second.accountId);
    await user.type(screen.getByLabelText('Amount'), '100');
    await user.click(screen.getByRole('button', { name: 'Transfer funds' }));
    expect(transfer).toHaveBeenCalledWith({ fromAccountId: 'acc-101', toAccountId: 'acc-202', amount: 100 });
    expect(await screen.findByText('audit-22')).toBeInTheDocument();
    expect(screen.getByText('$450.00')).toBeInTheDocument();
    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  it('shows a backend transfer failure', async () => {
    vi.spyOn(accountsApi, 'list').mockResolvedValue([account, second]);
    vi.spyOn(accountsApi, 'transfer').mockRejectedValue(new ApiError('Insufficient funds', 400));
    renderRoute(<TransferPage />);
    const user = userEvent.setup();
    await screen.findAllByRole('option', { name: /Ada Lovelace/ });
    await user.selectOptions(screen.getByLabelText('From account'), account.accountId);
    await user.selectOptions(screen.getByLabelText('To account'), second.accountId);
    await user.type(screen.getByLabelText('Amount'), '1000');
    await user.click(screen.getByRole('button', { name: 'Transfer funds' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Insufficient funds');
  });
});
