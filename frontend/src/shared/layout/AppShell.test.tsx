import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '@/shared/auth/AuthContext';
import type { Role } from '@/shared/types/api';
import { managerAuth } from '@/test/render';
import { AppShell } from '@/shared/layout/AppShell';

const expectedNavigation: Record<Role, string[]> = {
  CUSTOMER: ['Overview', 'My Accounts', 'Transfer', 'Profile'],
  TELLER: ['Overview', 'Customers', 'Accounts'],
  MANAGER: ['Overview', 'Customers', 'Accounts', 'Transfers', 'Audit'],
  AUDITOR: ['Overview', 'Customers', 'Accounts', 'Audit'],
  ADMIN: ['Overview', 'Customers', 'Accounts', 'Transfers', 'Audit', 'Access Management', 'Security Audit'],
};

function authFor(role: Role): AuthContextValue {
  return {
    ...managerAuth,
    username: role.toLowerCase(),
    primaryRole: role,
    roles: [role],
    bankUserLinked: role === 'CUSTOMER',
    logout: vi.fn(),
  };
}

function renderShell(role: Role) {
  return render(
    <AuthContext.Provider value={authFor(role)}>
      <MemoryRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<p>Route content</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('AppShell role navigation', () => {
  it.each(Object.entries(expectedNavigation) as [Role, string[]][])('shows only the %s navigation', (role, labels) => {
    const { container } = renderShell(role);
    const desktop = container.querySelector('.sidebar--desktop');
    expect(desktop).not.toBeNull();
    const navigation = within(desktop as HTMLElement).getByRole('navigation', { name: 'Primary navigation' });
    expect(
      within(navigation)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(labels);
  });

  it('traps focus in the mobile sheet, closes with Escape, and restores trigger focus', async () => {
    renderShell('CUSTOMER');
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: 'Open navigation' });
    trigger.focus();
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Navigation' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Navigation' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
