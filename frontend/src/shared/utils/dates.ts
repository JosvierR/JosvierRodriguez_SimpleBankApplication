import i18n from '@/shared/i18n/i18n';
import { localeFor } from '@/shared/i18n/language';

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(localeFor(i18n.resolvedLanguage || 'en'), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}
