import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { meApi } from '@/features/customer-portal/api/meApi';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import type { AuthContextValue } from '@/shared/auth/AuthContext';
import { customer, managerAuth, renderRoute } from '@/test/render';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { CustomerTransferPage } from '@/features/customer-portal/pages/CustomerTransferPage';
import { MyAccountsPage } from '@/features/customer-portal/pages/CustomerAccountsPage';

const customerAuth: AuthContextValue = {
  ...managerAuth,
  username: 'ada',
  roles: ['CUSTOMER'],
  primaryRole: 'CUSTOMER',
  bankUserLinked: true,
};

describe('customer portal ownership boundaries', () => {
  it('shows the pending-link state without requesting banking data', () => {
    const ownAccounts = vi.spyOn(meApi, 'accounts');
    renderRoute(<DashboardPage />, '/', '*', { ...customerAuth, bankUserLinked: false });
    expect(screen.getByText('Bank profile connection pending')).toBeInTheDocument();
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
      { accountId: 'own-1', accountType: 'SAVINGS', balance: 125, createdAt: customer.createdAt },
    ]);
    renderRoute(<CustomerTransferPage />, '/my-transfer', '*', customerAuth);
    expect(await screen.findByText('Two accounts required')).toBeInTheDocument();
  });
});
