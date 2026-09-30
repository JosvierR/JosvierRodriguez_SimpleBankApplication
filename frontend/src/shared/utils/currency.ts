import i18n from '@/shared/i18n/i18n';
import { localeFor } from '@/shared/i18n/language';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(localeFor(i18n.resolvedLanguage || 'en'), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
