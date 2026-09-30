export const APP_HOME = '/app';

export function appPath(path = '/'): string {
  if (!path || path === '/') return APP_HOME;
  return `${APP_HOME}${path.startsWith('/') ? path : `/${path}`}`;
}

export const LEGACY_ROOTS = ['customers', 'accounts', 'transfer', 'audits', 'my-accounts', 'my-transfer', 'profile', 'admin'];
