import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { meApi } from '@/features/customer-portal/api/meApi';
import { CustomerTransferPage } from '@/features/customer-portal/pages/CustomerTransferPage';
import type { AuthContextValue } from '@/shared/auth/AuthContext';
import { customer, managerAuth, renderRoute } from '@/test/render';

const customerAuth: AuthContextValue = {
  ...managerAuth,
  username: 'sofia',
  roles: ['CUSTOMER'],
  primaryRole: 'CUSTOMER',
  bankUserLinked: true,
};

const accounts = [
  { accountId: 'own-1', accountType: 'CHECKING' as const, balance: 500, createdAt: customer.createdAt, accountNumber: '100000000001' },
  { accountId: 'own-2', accountType: 'SAVINGS' as const, balance: 80, createdAt: customer.createdAt, accountNumber: '100000000002' },
];

describe('internal transfer flow', () => {
  it('previews and confirms a transfer to another Simple Bank account', async () => {
    vi.spyOn(meApi, 'accounts').mockResolvedValue(accounts);
    vi.spyOn(meApi, 'previewTransfer').mockResolvedValue({
      sourceAccountNumberMasked: '•••• 0001',
      sourceBalance: 500,
      destinationAccountNumberMasked: '•••• 0021',
      destinationDisplayName: 'Ethan P.',
      amount: 25,
      ownTransfer: false,
    });
    vi.spyOn(meApi, 'transfer').mockResolvedValue({
      transferReference: 'TRF-ABC123',
      amount: 25,
      sourceAccountNumberMasked: '•••• 0001',
      destinationAccountNumberMasked: '•••• 0021',
      destinationDisplayName: 'Ethan P.',
      sourceBalance: 475,
      createdAt: customer.createdAt,
    });
    renderRoute(<CustomerTransferPage />, '/my-transfer', '*', customerAuth);
    expect(await screen.findByRole('radio', { name: 'My account' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Another Simple Bank account' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), 'own-1');
    await userEvent.type(screen.getByRole('textbox', { name: 'Destination account number' }), '100000000021');
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '25');
    await userEvent.click(screen.getByRole('button', { name: 'Preview transfer' }));
    expect(await screen.findByText('Ethan P.')).toBeInTheDocument();
    expect(screen.getByText('•••• 0021')).toBeInTheDocument();
    expect(screen.getAllByText('100000000001').length).toBeGreaterThan(0);
    await userEvent.click(screen.getByRole('button', { name: 'Confirm transfer' }));
    expect(await screen.findByText('Transfer complete')).toBeInTheDocument();
    expect(screen.getByText('TRF-ABC123')).toBeInTheDocument();
    expect(screen.getByText('•••• 0021')).toBeInTheDocument();
    await waitFor(() => expect(meApi.transfer).toHaveBeenCalled());
  });
});
