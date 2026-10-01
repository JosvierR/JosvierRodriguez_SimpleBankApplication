import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { AuthContext, type AuthContextValue } from '@/shared/auth/AuthContext';
import { jsonResponse } from '@/test/render';

const signedOut: AuthContextValue = {
  token: null,
  username: null,
  roles: [],
  primaryRole: null,
  bankUserLinked: false,
  isAuthenticated: false,
  isLoading: false,
  login: async () => undefined,
  register: async () => undefined,
  logout: () => undefined,
  verify: async () => undefined,
};

function renderLanding(auth = signedOut) {
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe('landing page', () => {
  it('presents the bank brand, primary actions, public anchors, and demo disclosure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ demoMode: true })));
    renderLanding();
    expect(screen.getAllByLabelText('Simple Bank')[0]).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Banking, clearly organized.' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open demo' })).toHaveAttribute('href', '#demo');
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Personal banking' })).toHaveAttribute('href', '#personal');
    expect(await screen.findByText('Demo environment')).toBeInTheDocument();
    expect(screen.getByText(/educational banking application/i)).toBeInTheDocument();
  });

  it('opens the accessible mobile navigation and switches the experience to Spanish', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ demoMode: false })));
    renderLanding();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Operations' })).toHaveAttribute('href', '#operations');
    await user.click(screen.getByRole('button', { name: 'Close menu' }));
    await user.click(screen.getAllByRole('button', { name: 'Español' })[0]);
    expect(screen.getByRole('heading', { name: 'Banca, claramente organizada.' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
  });

  it('offers Open app instead of Sign in to authenticated visitors', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ demoMode: true })));
    renderLanding({ ...signedOut, token: 'token', username: 'sofia', roles: ['CUSTOMER'], primaryRole: 'CUSTOMER', isAuthenticated: true });
    expect(screen.getAllByRole('link', { name: 'Open app' })[0]).toHaveAttribute('href', '/app');
    expect(screen.queryByRole('link', { name: 'Sign in' })).not.toBeInTheDocument();
  });
});
