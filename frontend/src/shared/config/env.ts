const REMOTE_APP_ENVIRONMENTS = new Set(['staging', 'production']);

// Vite only inlines a direct `import.meta.env.VITE_*` read. A default parameter
// hides those names, so a staging build would keep calling the same-origin `/api`.
const configuredFromBuild = import.meta.env.VITE_API_BASE_URL;
const appEnvFromBuild = import.meta.env.VITE_APP_ENV;

export function apiBaseUrl(env?: Partial<ImportMetaEnv>): string {
  const configured = (env ? env.VITE_API_BASE_URL : configuredFromBuild)?.trim();
  const appEnv = env ? env.VITE_APP_ENV : appEnvFromBuild;
  if (appEnv && REMOTE_APP_ENVIRONMENTS.has(appEnv) && (!configured || configured.includes('undefined'))) {
    throw new Error('VITE_API_BASE_URL is required when VITE_APP_ENV is staging or production');
  }
  return configured || '/api';
}
