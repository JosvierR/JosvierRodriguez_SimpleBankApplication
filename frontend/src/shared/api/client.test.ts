import { describe, expect, it, vi } from 'vitest';
import { AUTH_INVALID_EVENT, ApiError, request, TOKEN_KEY } from '@/shared/api/client';
import { jsonResponse } from '@/test/render';

describe('API client', () => {
  it('adds the stored bearer token', async () => {
    sessionStorage.setItem(TOKEN_KEY, 'token-value');
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ ok: true }));
    await request('/users');
    const headers = new Headers(fetchMock.mock.calls[0][1]?.headers);
    expect(headers.get('Authorization')).toBe('Bearer token-value');
  });

  it('parses the backend ErrorResponse', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(
        { timestamp: '2026-01-01', status: 409, error: 'Conflict', message: 'Customer has accounts', path: '/api/users/1' },
        409,
      ),
    );
    await expect(request('/users/1', { method: 'DELETE' })).rejects.toMatchObject({
      name: 'ApiError',
      status: 409,
      message: 'Customer has accounts',
    });
  });

  it('clears an expired session and announces authentication reset', async () => {
    sessionStorage.setItem(TOKEN_KEY, 'expired');
    const listener = vi.fn();
    window.addEventListener(AUTH_INVALID_EVENT, listener);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ status: 401, message: 'Authentication is required' }, 401));
    await expect(request('/users')).rejects.toBeInstanceOf(ApiError);
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(listener).toHaveBeenCalledOnce();
  });
});
