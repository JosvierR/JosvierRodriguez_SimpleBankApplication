import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { meApi } from '@/features/customer-portal/api/meApi';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import type { AuthContextValue } from '@/shared/auth/AuthContext';
import { customer, managerAuth, renderRoute } from '@/test/render';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import { CustomerTransferPage } from '@/features/customer-portal/pages/CustomerTransferPage';
import { MyAccountsPage, MyTransactionsPage } from '@/features/customer-portal/pages/CustomerAccountsPage';

const customerAuth: AuthContextValue = {
  ...managerAuth,
  username: 'ada',
  roles: ['CUSTOMER'],
  primaryRole: 'CUSTOMER',
  bankUserLinked: true,
};

describe('customer portal ownership boundaries', () => {
  it('shows the pending-link state from the ownership-scoped dashboard response', async () => {
    const ownAccounts = vi.spyOn(meApi, 'accounts');
    vi.spyOn(dashboardApi, 'get').mockResolvedValue({
      role: 'CUSTOMER',
      generatedAt: customer.createdAt,
      bankUserLinked: false,
      displayName: 'ada',
      totalBalance: 0,
      accountCount: 0,
      accounts: [],
      last30DayDeposits: 0,
      last30DayWithdrawals: 0,
      last30DayTransfersIn: 0,
      last30DayTransfersOut: 0,
      activitySeries: [],
      recentTransactions: [],
    });
    renderRoute(<DashboardPage />, '/', '*', { ...customerAuth, bankUserLinked: false });
    expect(await screen.findByText('Bank profile connection pending')).toBeInTheDocument();
    expect(ownAccounts).not.toHaveBeenCalled();
  });

  it('loads customer accounts only through the /me client', async () => {
    const ownAccounts = vi
      .spyOn(meApi, 'accounts')
      .mockResolvedValue([{ accountId: 'own-1', accountType: 'CHECKING', balance: 125, createdAt: customer.createdAt }]);
    const globalAccounts = vi.spyOn(accountsApi, 'list');
    renderRoute(<MyAccountsPage />, '/my-accounts', '*', customerAuth);
    expect(await screen.findByText('$125.00')).toBeInTheDocument();
    expect(ownAccounts).toHaveBeenCalledOnce();
    expect(globalAccounts).not.toHaveBeenCalled();
  });

  it('shows a transfer empty state when the customer owns fewer than two accounts', async () => {
    vi.spyOn(meApi, 'accounts').mockResolvedValue([
      { accountId: 'own-1', accountType: 'SAVINGS', balance: 125, createdAt: customer.createdAt, accountNumber: '100000000001' },
    ]);
    renderRoute(<CustomerTransferPage />, '/my-transfer', '*', customerAuth);
    expect(await screen.findByRole('radio', { name: 'Another Simple Bank account' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Preview transfer' })).toBeInTheDocument();
  });

  it('labels transfer history with the counterparty and masked account', async () => {
    vi.spyOn(meApi, 'account').mockResolvedValue({
      accountId: 'own-1',
      accountType: 'CHECKING',
      balance: 400,
      createdAt: customer.createdAt,
      accountNumber: '100000000001',
    });
    vi.spyOn(meApi, 'transactions').mockResolvedValue([
      {
        transactionId: 'tx-out',
        accountId: 'own-1',
        type: 'TRANSFER_OUT',
        amount: 100,
        createdAt: customer.createdAt,
        counterpartyDisplayName: 'Ethan P.',
        counterpartyAccountNumberMasked: '•••• 1982',
      },
    ]);
    renderRoute(<MyTransactionsPage />, '/my-accounts/own-1/transactions', '/my-accounts/:accountId/transactions', customerAuth);
    expect(await screen.findByText('Transfer out to Ethan P.')).toBeInTheDocument();
    expect(screen.getByText(/•••• 1982/)).toBeInTheDocument();
    expect(screen.getByText(/-\$100\.00/)).toBeInTheDocument();
  });
});
