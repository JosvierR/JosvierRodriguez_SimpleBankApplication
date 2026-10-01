import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { LANGUAGE_KEY, normalizeLanguage } from '@/shared/i18n/language';
import enAdmin from '@/shared/i18n/locales/en/admin.json';
import enAuth from '@/shared/i18n/locales/en/auth.json';
import enBanking from '@/shared/i18n/locales/en/banking.json';
import enCommon from '@/shared/i18n/locales/en/common.json';
import enDashboard from '@/shared/i18n/locales/en/dashboard.json';
import enErrors from '@/shared/i18n/locales/en/errors.json';
import enLanding from '@/shared/i18n/locales/en/landing.json';
import esAdmin from '@/shared/i18n/locales/es/admin.json';
import esAuth from '@/shared/i18n/locales/es/auth.json';
import esBanking from '@/shared/i18n/locales/es/banking.json';
import esCommon from '@/shared/i18n/locales/es/common.json';
import esDashboard from '@/shared/i18n/locales/es/dashboard.json';
import esErrors from '@/shared/i18n/locales/es/errors.json';
import esLanding from '@/shared/i18n/locales/es/landing.json';
import frAdmin from '@/shared/i18n/locales/fr/admin.json';
import frAuth from '@/shared/i18n/locales/fr/auth.json';
import frBanking from '@/shared/i18n/locales/fr/banking.json';
import frCommon from '@/shared/i18n/locales/fr/common.json';
import frDashboard from '@/shared/i18n/locales/fr/dashboard.json';
import frErrors from '@/shared/i18n/locales/fr/errors.json';
import frLanding from '@/shared/i18n/locales/fr/landing.json';

export const namespaces = ['common', 'auth', 'landing', 'banking', 'admin', 'dashboard', 'errors'] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        landing: enLanding,
        banking: enBanking,
        admin: enAdmin,
        dashboard: enDashboard,
        errors: enErrors,
      },
      es: {
        common: esCommon,
        auth: esAuth,
        landing: esLanding,
        banking: esBanking,
        admin: esAdmin,
        dashboard: esDashboard,
        errors: esErrors,
      },
      fr: {
        common: frCommon,
        auth: frAuth,
        landing: frLanding,
        banking: frBanking,
        admin: frAdmin,
        dashboard: frDashboard,
        errors: frErrors,
      },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr'],
    load: 'languageOnly',
    ns: [...namespaces],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_KEY,
      caches: ['localStorage'],
    },
  });

function applyLanguage(language: string) {
  document.documentElement.lang = normalizeLanguage(language);
}

i18n.on('languageChanged', applyLanguage);
applyLanguage(i18n.resolvedLanguage || 'en');

export default i18n;
