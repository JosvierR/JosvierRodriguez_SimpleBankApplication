import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LandingPage } from '@/features/landing/pages/LandingPage';
import { AuthContext, type AuthContextValue } from '@/shared/auth/AuthContext';

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

describe('landing page', () => {
  it('keeps sign in and the demo section available', () => {
    render(
      <AuthContext.Provider value={signedOut}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByRole('heading', { name: 'Banking operations, clearly organized.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Sign in' })[0]).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Open demo' })).toHaveAttribute('href', '#demo');
  });

  it('switches the public headline to Spanish', async () => {
    render(
      <AuthContext.Provider value={signedOut}>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Español' }));
    expect(screen.getByRole('heading', { name: 'Operaciones bancarias, claramente organizadas.' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
  });
});
