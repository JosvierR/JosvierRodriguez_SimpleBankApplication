import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/shared/i18n/language';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const active = (i18n.resolvedLanguage || 'en').slice(0, 2) as AppLanguage;
  return (
    <div className="language-switcher" role="group" aria-label={t('language')}>
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          className={language === active ? 'is-active' : ''}
          aria-pressed={language === active}
          lang={language}
          onClick={() => void i18n.changeLanguage(language)}
        >
          {t(`languages.${language}`)}
        </button>
      ))}
    </div>
  );
}
