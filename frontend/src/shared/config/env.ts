const REMOTE_APP_ENVIRONMENTS = new Set(['staging', 'production']);

export function apiBaseUrl(env: ImportMetaEnv = import.meta.env): string {
  const configured = env.VITE_API_BASE_URL?.trim();
  const appEnv = env.VITE_APP_ENV;
  if (appEnv && REMOTE_APP_ENVIRONMENTS.has(appEnv) && (!configured || configured.includes('undefined'))) {
    throw new Error('VITE_API_BASE_URL is required when VITE_APP_ENV is staging or production');
  }
  return configured || '/api';
}
