import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { authApi } from '@/features/auth/api/authApi';
import { TOKEN_KEY } from '@/shared/api/client';
import { AuthProvider } from '@/shared/auth/AuthProvider';
import { useAuth } from '@/shared/auth/useAuth';
import type { AuthResponse } from '@/shared/types/api';

function Harness() {
  const auth = useAuth();
  const [error, setError] = useState('');
  return (
    <div>
      <span>{auth.isLoading ? 'loading' : auth.isAuthenticated ? `${auth.username}:${auth.roles.join(',')}` : 'signed-out'}</span>
      <button
        onClick={() => void auth.login({ username: 'ada', password: 'password123' }).catch((cause: Error) => setError(cause.message))}
      >
        login
      </button>
      <button
        onClick={() =>
          void auth
            .register({ username: 'ada', email: 'ada@example.com', password: 'password123' })
            .catch((cause: Error) => setError(cause.message))
        }
      >
        register
      </button>
      <button onClick={auth.logout}>logout</button>
      <span>{error}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  it('logs in, stores only the token, and logs out', async () => {
    vi.spyOn(authApi, 'login').mockResolvedValue({
      token: 'jwt',
      tokenType: 'Bearer',
      expiresIn: 3600,
      username: 'ada',
      roles: ['CUSTOMER'],
    });
    vi.spyOn(authApi, 'verify').mockResolvedValue({ username: 'ada', primaryRole: 'CUSTOMER', bankUserLinked: true, roles: ['CUSTOMER'] });
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'login' }));
    expect(await screen.findByText('ada:CUSTOMER')).toBeInTheDocument();
    expect(sessionStorage.length).toBe(1);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('jwt');
    await user.click(screen.getByRole('button', { name: 'logout' }));
    expect(screen.getByText('signed-out')).toBeInTheDocument();
  });

  it('shows a login failure without authenticating', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(new Error('Invalid credentials'));
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'login' }));
    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
    expect(screen.getByText('signed-out')).toBeInTheDocument();
  });

  it.each(['login', 'register'] as const)('clears a partial %s session when verification fails', async (action) => {
    const response: AuthResponse = {
      token: 'partial-jwt',
      tokenType: 'Bearer',
      expiresIn: 3600,
      username: 'ada',
      roles: ['CUSTOMER'],
    };
    vi.spyOn(authApi, action).mockResolvedValue(response);
    vi.spyOn(authApi, 'verify').mockRejectedValue(new Error('Bank service unavailable'));
    render(
      <AuthProvider>
        <Harness />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: action }));
    expect(await screen.findByText('Bank service unavailable')).toBeInTheDocument();
    expect(screen.getByText('signed-out')).toBeInTheDocument();
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('restores a stored session through verify', async () => {
    sessionStorage.setItem(TOKEN_KEY, 'jwt');
    vi.spyOn(authApi, 'verify').mockResolvedValue({
      username: 'restored',
      primaryRole: 'CUSTOMER',
      bankUserLinked: false,
      roles: ['CUSTOMER'],
    });
    await act(async () =>
      render(
        <AuthProvider>
          <Harness />
        </AuthProvider>,
      ),
    );
    expect(await screen.findByText('restored:CUSTOMER')).toBeInTheDocument();
  });
});
