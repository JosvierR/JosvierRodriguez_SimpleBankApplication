import { ApiError } from '@/shared/api/client';
import i18n from '@/shared/i18n/i18n';

export function getErrorMessage(error: unknown, fallback = i18n.t('errors:fallback')): string {
  if (!(error instanceof ApiError)) return fallback;
  if (error.code && i18n.exists(`errors:${error.code}`)) return i18n.t(`errors:${error.code}`);
  const code = error.details?.code;
  if (code && i18n.exists(`errors:${code}`)) return i18n.t(`errors:${code}`);
  if (error.status === 403) return i18n.t('errors:ACCESS_DENIED');
  if (error.status === 404) return i18n.t('errors:RESOURCE_NOT_FOUND');
  return error.message || fallback;
}

export function amountError(value: string): string | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return i18n.t('errors:VALIDATION_ERROR');
  if (Number(value) <= 0) return i18n.t('errors:VALIDATION_ERROR');
  return null;
}
