import { Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { APP_HOME } from '@/app/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

interface PublicConfig {
  demoMode: boolean;
  registrationEnabled: boolean;
  supportedLanguages: string[];
}

export function LandingPage() {
  const { t } = useTranslation('landing');
  const { isAuthenticated } = useAuth();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    void fetch('/api/public/config')
      .then((response) => (response.ok ? response.json() : null))
      .then((config: PublicConfig | null) => setDemoMode(Boolean(config?.demoMode)))
      .catch(() => setDemoMode(false));
  }, []);

  return (
    <div className="landing">
      <header className="landing__header">
        <a className="landing__brand" href="#top">
          <Building2 size={18} aria-hidden="true" /> Simple Bank
        </a>
        <nav aria-label={t('product')}>
          <a href="#product">{t('product')}</a>
          <a href="#security">{t('security')}</a>
          <a href="#demo">{t('demo')}</a>
        </nav>
        <div className="landing__tools">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Link className="button" to={APP_HOME}>
              {t('common:openApp')}
            </Link>
          ) : (
            <Link className="button button--secondary" to="/login">
              {t('auth:signIn')}
            </Link>
          )}
        </div>
      </header>
      <main id="top">
        {demoMode && <p className="demo-badge">{t('common:demoBadge')}</p>}
        <section className="landing__hero">
          <h1>{t('headline')}</h1>
          <p>{t('body')}</p>
          <div className="landing__actions">
            <a className="button" href="#demo">
              {t('openDemo')}
            </a>
            <Link className="button button--secondary" to={isAuthenticated ? APP_HOME : '/login'}>
              {isAuthenticated ? t('common:openApp') : t('auth:signIn')}
            </Link>
          </div>
        </section>
        <section id="product" className="landing__capabilities">
          <article>
            <h2>{t('customerTitle')}</h2>
            <p>{t('customerBody')}</p>
          </article>
          <article>
            <h2>{t('staffTitle')}</h2>
            <p>{t('staffBody')}</p>
          </article>
          <article>
            <h2>{t('auditTitle')}</h2>
            <p>{t('auditBody')}</p>
          </article>
        </section>
        <section id="security" className="landing__security">
          <div>
            <h2>{t('securityTitle')}</h2>
            <p>{t('securityBody')}</p>
          </div>
          <div className="landing__preview" aria-label={t('previewLabel')}>
            <div className="landing__preview-nav" />
            <div className="landing__preview-main">
              <span />
              <span />
              <span />
            </div>
          </div>
        </section>
        <section id="demo" className="landing__demo">
          <h2>{t('demoTitle')}</h2>
          <p>{t('demoBody')}</p>
          {demoMode && <p>{t('common:demoNote')}</p>}
          <a href="https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/blob/FullStack-BankApp-Product-Spike-i18n-Demo/docs/demo-credentials.txt">
            {t('viewCredentials')}
          </a>
        </section>
      </main>
      <footer className="landing__footer">{t('footer')}</footer>
    </div>
  );
}
