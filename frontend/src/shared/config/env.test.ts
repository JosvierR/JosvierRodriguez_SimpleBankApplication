import { describe, expect, it } from 'vitest';
import { apiBaseUrl } from '@/shared/config/env';

const env = (values: Partial<ImportMetaEnv>): ImportMetaEnv => values as ImportMetaEnv;

describe('api base URL', () => {
  it('defaults local development to the same-origin proxy', () => {
    expect(apiBaseUrl(env({}))).toBe('/api');
  });

  it('uses the public remote base when one is configured', () => {
    expect(apiBaseUrl(env({ VITE_API_BASE_URL: 'https://staging.example/api', VITE_APP_ENV: 'staging' }))).toBe(
      'https://staging.example/api',
    );
  });

  it('refuses a remote build that would call undefined/api', () => {
    expect(() => apiBaseUrl(env({ VITE_APP_ENV: 'production', VITE_API_BASE_URL: 'undefined/api' }))).toThrow(/VITE_API_BASE_URL/);
  });
});
