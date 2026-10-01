import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ToastProvider, useToast } from '@/shared/components/Toast';
import i18n from '@/shared/i18n/i18n';
import { LANGUAGE_KEY, localeFor, normalizeLanguage } from '@/shared/i18n/language';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';

function ToastProbe() {
  const { notify } = useToast();
  return (
    <button type="button" onClick={() => notify('Saved', 'success')}>
      show toast
    </button>
  );
}

describe('language', () => {
  it('starts in English and switches to Spanish and French', async () => {
    render(<LanguageSwitcher />);
    const user = userEvent.setup();
    expect(document.documentElement.lang).toBe('en');
    await user.click(screen.getByRole('button', { name: 'Español' }));
    expect(i18n.resolvedLanguage).toBe('es');
    expect(document.documentElement.lang).toBe('es');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('es');
    await user.click(screen.getByRole('button', { name: 'Français' }));
    expect(document.documentElement.lang).toBe('fr');
    expect(i18n.t('common:roles.ADMIN')).toBe('Administrateur');
    expect(i18n.t('banking:accountType.CHECKING')).toBe('Compte courant');
    expect(i18n.t('common:customers', { count: 1 })).toBe('1 client');
    expect(i18n.t('common:customers', { count: 2 })).toBe('2 clients');
  });

  it('keeps Spanish role labels and English plural forms', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.t('common:roles.CUSTOMER')).toBe('Cliente');
    expect(i18n.t('common:roles.MANAGER')).toBe('Gerente');
    expect(i18n.t('banking:accountType.SAVINGS')).toBe('Ahorros');
    expect(i18n.t('common:accounts', { count: 1 })).toBe('1 cuenta');
    expect(i18n.t('common:accounts', { count: 3 })).toBe('3 cuentas');
    await i18n.changeLanguage('en');
    expect(i18n.t('common:records', { count: 1 })).toBe('1 record');
    expect(i18n.t('common:records', { count: 4 })).toBe('4 records');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('en');
  });

  it('remembers the saved language after another change', async () => {
    await i18n.changeLanguage('fr');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('fr');
    await i18n.changeLanguage('es');
    expect(localStorage.getItem(LANGUAGE_KEY)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('formats Spanish currency without doing math on the formatted text', async () => {
    await i18n.changeLanguage('es');
    const formatted = formatCurrency(1250);
    expect(formatted).toContain('1');
    expect(formatted).not.toBe('1250');
    await i18n.changeLanguage('en');
  });

  it('falls back to English for an unsupported language', () => {
    expect(localeFor('de')).toBe('en-US');
    expect(normalizeLanguage('de-DE')).toBe('en');
  });

  it('maps browser language codes onto locales', () => {
    expect(localeFor('en-GB')).toBe('en-US');
    expect(localeFor('es-MX')).toBe('es-ES');
    expect(localeFor('fr-CA')).toBe('fr-FR');
  });

  it('formats USD and dates for the active locale', async () => {
    await i18n.changeLanguage('en');
    expect(formatCurrency(1250)).toBe('$1,250.00');
    expect(localeFor('es')).toBe('es-ES');
    await i18n.changeLanguage('fr');
    expect(formatCurrency(1250)).toMatch(/1/);
    expect(formatDateTime('2026-09-12T15:00:00Z')).toMatch(/2026/);
    expect(i18n.t('common:roles.TELLER')).toBe('Guichetier');
    expect(i18n.t('banking:accountType.SAVINGS')).toBe('Épargne');
    expect(i18n.t('common:accounts', { count: 2 })).toBe('2 comptes');
    expect(i18n.t('errors:INSUFFICIENT_FUNDS')).toBe('Fonds insuffisants');
  });

  it('translates the premium filter and toast accessibility labels', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastProbe />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'show toast' }));
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dismiss notification' })).toBeInTheDocument();
    expect(i18n.t('banking:filters.premiumThresholdLabel')).toBe('Premium balance threshold');
    expect(i18n.t('banking:filters.minimumBalancePlaceholder')).toBe('Minimum balance');

    await i18n.changeLanguage('es');
    expect(screen.getByLabelText('Notificaciones')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descartar notificación' })).toBeInTheDocument();
    expect(i18n.t('banking:filters.premiumThresholdLabel')).toBe('Umbral de saldo premium');
    expect(i18n.t('banking:filters.minimumBalancePlaceholder')).toBe('Saldo mínimo');

    await i18n.changeLanguage('fr');
    expect(screen.getByLabelText('Notifications')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer la notification' })).toBeInTheDocument();
    expect(i18n.t('banking:filters.premiumThresholdLabel')).toBe('Seuil de solde premium');
    expect(i18n.t('banking:filters.minimumBalancePlaceholder')).toBe('Solde minimum');
    await i18n.changeLanguage('en');
  });
});
