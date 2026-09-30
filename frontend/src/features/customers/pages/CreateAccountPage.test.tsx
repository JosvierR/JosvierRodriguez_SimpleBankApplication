import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { usersApi } from '@/features/customers/api/usersApi';
import { ToastProvider } from '@/shared/components/Toast';
import { account, customer } from '@/test/render';
import { CreateAccountPage } from '@/features/customers/pages/CreateAccountPage';

function renderPage(path = '/accounts/new') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ToastProvider>
        <Routes>
          <Route path="/accounts/new" element={<CreateAccountPage />} />
          <Route path="/app/accounts/:id" element={<p>Account destination</p>} />
        </Routes>
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('CreateAccountPage', () => {
  it('creates a new customer and then their account', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([]);
    vi.spyOn(usersApi, 'create').mockResolvedValue(customer);
    const create = vi.spyOn(accountsApi, 'create').mockResolvedValue(account);
    renderPage();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Customer name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Open account' }));
    expect(usersApi.create).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com' });
    expect(create).toHaveBeenCalledWith({ userId: 'user-1', accountType: 'CHECKING' });
    expect(await screen.findByText('Account destination')).toBeInTheDocument();
  });

  it('opens another account for an existing customer', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([customer]);
    const create = vi.spyOn(accountsApi, 'create').mockResolvedValue({ ...account, accountType: 'SAVINGS' });
    renderPage('/accounts/new?userId=user-1');
    const user = userEvent.setup();
    await screen.findByRole('option', { name: /Ada Lovelace/ });
    await user.click(screen.getByText('Savings'));
    await user.click(screen.getByRole('button', { name: 'Open account' }));
    expect(create).toHaveBeenCalledWith({ userId: 'user-1', accountType: 'SAVINGS' });
    expect(await screen.findByText('Account destination')).toBeInTheDocument();
  });

  it('preserves and exposes recovery for a customer-created/account-failed state', async () => {
    vi.spyOn(usersApi, 'list').mockResolvedValue([]);
    vi.spyOn(usersApi, 'create').mockResolvedValue(customer);
    vi.spyOn(accountsApi, 'create').mockRejectedValue(new Error('service failed'));
    renderPage();
    const user = userEvent.setup();
    await user.type(await screen.findByLabelText('Customer name'), 'Ada');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Open account' }));
    expect(await screen.findByText(/Customer was created, but the account could not be opened/)).toBeInTheDocument();
    expect(screen.getByText(/user-1/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open account for this customer' })).toBeInTheDocument();
  });
});
