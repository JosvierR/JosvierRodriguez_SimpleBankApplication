import i18n from '@/shared/i18n/i18n';
import { localeFor } from '@/shared/i18n/language';

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(localeFor(i18n.resolvedLanguage || 'en'), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function formatShortDate(value: string): string {
  const normalized = value.length === 10 ? `${value}T00:00:00` : value;
  return new Intl.DateTimeFormat(localeFor(i18n.resolvedLanguage || 'en'), {
    month: 'short',
    day: 'numeric',
  }).format(new Date(normalized));
}
