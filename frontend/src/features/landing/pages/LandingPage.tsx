import * as Dialog from '@radix-ui/react-dialog';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Building2, Check, Menu, ShieldCheck, UsersRound, WalletCards, X } from 'lucide-react';
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

const credentialsUrl =
  'https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/blob/FullStack-BankApp-Product-Spike-i18n-Demo/docs/demo-credentials.txt';

export function LandingPage() {
  const { t } = useTranslation(['landing', 'common', 'auth']);
  const { isAuthenticated } = useAuth();
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    void fetch('/api/public/config')
      .then((response) => (response.ok ? response.json() : null))
      .then((config: PublicConfig | null) => setDemoMode(Boolean(config?.demoMode)))
      .catch(() => setDemoMode(false));
  }, []);

  const accessLabel = isAuthenticated ? t('common:openApp') : t('auth:signIn');
  const accessPath = isAuthenticated ? APP_HOME : '/login';

  return (
    <div className="landing">
      <header className="landing__header">
        <a className="landing__brand" href="#top" aria-label="Simple Bank">
          <span>
            <Building2 size={18} aria-hidden="true" />
          </span>
          <strong>Simple Bank</strong>
        </a>
        <nav className="landing__desktop-nav" aria-label={t('landing:navigation')}>
          <a href="#personal">{t('landing:personalBanking')}</a>
          <a href="#operations">{t('landing:operations')}</a>
          <a href="#security">{t('landing:security')}</a>
          <a href="#demo">{t('landing:demo')}</a>
        </nav>
        <div className="landing__tools">
          <LanguageSwitcher />
          <Link className="button button--secondary landing__access" to={accessPath}>
            {accessLabel}
          </Link>
          <MobileNavigation accessLabel={accessLabel} accessPath={accessPath} />
        </div>
      </header>

      <main id="top">
        <section className="landing__hero" id="personal">
          <div className="landing__hero-copy">
            <p className="landing__eyebrow">{t('landing:eyebrow')}</p>
            <h1>{t('landing:headline')}</h1>
            <p>{t('landing:body')}</p>
            <div className="landing__actions">
              <a className="button" href="#demo">
                {t('landing:openDemo')}
              </a>
              <Link className="button button--secondary" to={accessPath}>
                {accessLabel}
              </Link>
            </div>
            {demoMode ? (
              <p className="demo-badge">
                <span />
                {t('common:demoBadge')}
              </p>
            ) : null}
          </div>
          <ProductPreview />
        </section>

        <section className="landing__capability-section" id="operations" aria-labelledby="capabilities-title">
          <div className="landing__section-intro">
            <p className="landing__eyebrow">{t('landing:capabilitiesEyebrow')}</p>
            <h2 id="capabilities-title">{t('landing:capabilitiesTitle')}</h2>
          </div>
          <div className="landing__capabilities">
            <Capability icon={WalletCards} title={t('landing:accountsTitle')} body={t('landing:accountsBody')} />
            <Capability icon={ArrowLeftRight} title={t('landing:transfersTitle')} body={t('landing:transfersBody')} />
            <Capability icon={ShieldCheck} title={t('landing:accessTitle')} body={t('landing:accessBody')} />
          </div>
        </section>

        <section className="landing__security" id="security">
          <div className="landing__section-intro">
            <p className="landing__eyebrow">{t('landing:securityEyebrow')}</p>
            <h2>{t('landing:securityTitle')}</h2>
            <p>{t('landing:securityBody')}</p>
          </div>
          <div className="landing__control-list">
            <Control title={t('landing:roleAccessTitle')} body={t('landing:roleAccessBody')} />
            <Control title={t('landing:isolationTitle')} body={t('landing:isolationBody')} />
            <Control title={t('landing:auditTitle')} body={t('landing:auditBody')} />
          </div>
        </section>

        <section className="landing__roles" aria-labelledby="roles-title">
          <div className="landing__section-intro">
            <p className="landing__eyebrow">{t('landing:rolesEyebrow')}</p>
            <h2 id="roles-title">{t('landing:rolesTitle')}</h2>
            <p>{t('landing:rolesBody')}</p>
          </div>
          <div className="landing__role-list">
            {(['CUSTOMER', 'TELLER', 'MANAGER', 'AUDITOR', 'ADMIN'] as const).map((role) => (
              <div key={role}>
                <span>{t(`common:roles.${role}`)}</span>
                <p>{t(`landing:roleDescriptions.${role}`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing__demo" id="demo">
          <div className="landing__demo-icon">
            <UsersRound size={24} aria-hidden="true" />
          </div>
          <div>
            <p className="landing__eyebrow">{t('landing:demoEyebrow')}</p>
            <h2>{t('landing:demoTitle')}</h2>
            <p>{t('landing:demoBody')}</p>
            <ul>
              <li>
                <Check size={15} aria-hidden="true" />
                {t('landing:demoIdentity')}
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                {t('landing:demoIsolation')}
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                {t('landing:demoNoProduction')}
              </li>
            </ul>
          </div>
          <div className="landing__demo-actions">
            <a className="button" href={credentialsUrl}>
              {t('landing:viewCredentials')}
            </a>
            <Link className="button button--secondary" to={accessPath}>
              {accessLabel}
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div>
          <a className="landing__brand" href="#top">
            <span>
              <Building2 size={16} aria-hidden="true" />
            </span>
            <strong>Simple Bank</strong>
          </a>
          <p>{t('landing:footer')}</p>
        </div>
        <div>
          <LanguageSwitcher />
          <a href={credentialsUrl}>{t('landing:demoAccounts')}</a>
          <a href="https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication">{t('landing:repository')}</a>
        </div>
      </footer>
    </div>
  );
}

function MobileNavigation({ accessLabel, accessPath }: { accessLabel: string; accessPath: string }) {
  const { t } = useTranslation('landing');
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="landing__menu-button" aria-label={t('openMenu')}>
          <Menu size={21} />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="sheet-overlay" />
        <Dialog.Content className="landing__mobile-menu">
          <Dialog.Title>{t('navigation')}</Dialog.Title>
          <Dialog.Close asChild>
            <button className="icon-button" aria-label={t('closeMenu')}>
              <X size={20} />
            </button>
          </Dialog.Close>
          <nav aria-label={t('navigation')}>
            <Dialog.Close asChild>
              <a href="#personal">{t('personalBanking')}</a>
            </Dialog.Close>
            <Dialog.Close asChild>
              <a href="#operations">{t('operations')}</a>
            </Dialog.Close>
            <Dialog.Close asChild>
              <a href="#security">{t('security')}</a>
            </Dialog.Close>
            <Dialog.Close asChild>
              <a href="#demo">{t('demo')}</a>
            </Dialog.Close>
          </nav>
          <Dialog.Close asChild>
            <Link className="button" to={accessPath}>
              {accessLabel}
            </Link>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ProductPreview() {
  const { t } = useTranslation('landing');
  return (
    <div className="bank-preview" aria-label={t('previewLabel')}>
      <div className="bank-preview__topline">
        <span>{t('previewOverview')}</span>
        <small>{t('previewDemo')}</small>
      </div>
      <div className="bank-preview__balance">
        <span>{t('previewTotalBalance')}</span>
        <strong>$—</strong>
      </div>
      <div className="bank-preview__account">
        <div>
          <WalletCards size={17} aria-hidden="true" />
          <span>
            <strong>{t('previewChecking')}</strong>
            <small>•••• 2841</small>
          </span>
        </div>
        <strong>$—</strong>
      </div>
      <div className="bank-preview__activity">
        <p>{t('previewRecent')}</p>
        <div>
          <span className="bank-preview__transaction bank-preview__transaction--in">
            <ArrowDownLeft size={15} />
          </span>
          <span>
            <strong>{t('previewDeposit')}</strong>
            <small>{t('previewToday')}</small>
          </span>
          <strong>+$—</strong>
        </div>
        <div>
          <span className="bank-preview__transaction bank-preview__transaction--out">
            <ArrowUpRight size={15} />
          </span>
          <span>
            <strong>{t('previewWithdrawal')}</strong>
            <small>{t('previewYesterday')}</small>
          </span>
          <strong>−$—</strong>
        </div>
      </div>
    </div>
  );
}

function Capability({ icon: Icon, title, body }: { icon: typeof WalletCards; title: string; body: string }) {
  return (
    <article>
      <span>
        <Icon size={18} aria-hidden="true" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

function Control({ title, body }: { title: string; body: string }) {
  return (
    <article>
      <Check size={17} aria-hidden="true" />
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}
