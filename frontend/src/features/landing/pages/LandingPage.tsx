import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, Check, ShieldCheck, UsersRound, WalletCards } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { APP_HOME } from '@/app/routes';
import { apiBaseUrl } from '@/shared/config/env';
import { PublicFooter } from '@/features/landing/components/PublicFooter';
import { PublicHeader } from '@/features/landing/components/PublicHeader';
import { useAuth } from '@/shared/auth/useAuth';

interface PublicConfig {
  demoMode: boolean;
  environment?: string;
  registrationEnabled: boolean;
  supportedLanguages: string[];
}

const demoCredentialsUrl = 'https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/blob/staging/docs/demo-credentials.txt';
const productionReviewerUrl =
  'https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication/blob/staging/docs/production-reviewer-access.md';
const repositoryUrl = 'https://github.com/JosvierR/JosvierRodriguez_SimpleBankApplication';

export function LandingPage() {
  const { t } = useTranslation(['landing', 'common', 'auth']);
  const { isAuthenticated } = useAuth();
  const [demoMode, setDemoMode] = useState(false);
  const [environment, setEnvironment] = useState<string>();

  useEffect(() => {
    void fetch(`${apiBaseUrl()}/public/config`)
      .then((response) => (response.ok ? response.json() : null))
      .then((config: PublicConfig | null) => {
        setDemoMode(Boolean(config?.demoMode));
        setEnvironment(config?.environment);
      })
      .catch(() => setDemoMode(false));
  }, []);

  const accessLabel = isAuthenticated ? t('common:openApp') : t('auth:signIn');
  const accessPath = isAuthenticated ? APP_HOME : '/login';
  const productionReview = environment === 'production';
  const credentialsUrl = productionReview ? productionReviewerUrl : demoCredentialsUrl;
  const credentialsLabel = productionReview ? t('landing:viewReviewAccounts') : t('landing:viewCredentials');

  return (
    <div className="landing">
      <PublicHeader isAuthenticated={isAuthenticated} environment={environment} />

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
            <h2>{productionReview ? t('landing:reviewTitle') : t('landing:demoTitle')}</h2>
            <p>{productionReview ? t('landing:reviewBody') : t('landing:demoBody')}</p>
            <ul>
              <li>
                <Check size={15} aria-hidden="true" />
                {productionReview ? t('landing:reviewRoles') : t('landing:demoIdentity')}
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                {productionReview ? t('landing:reviewIsolation') : t('landing:demoIsolation')}
              </li>
              <li>
                <Check size={15} aria-hidden="true" />
                {productionReview ? t('landing:reviewHistory') : t('landing:demoNoProduction')}
              </li>
            </ul>
          </div>
          <div className="landing__demo-actions">
            <a className="button" href={credentialsUrl}>
              {credentialsLabel}
            </a>
            <Link className="button button--secondary" to={accessPath}>
              {accessLabel}
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter
        credentialsUrl={credentialsUrl}
        credentialsLabel={productionReview ? t('landing:reviewAccounts') : undefined}
        repositoryUrl={repositoryUrl}
      />
    </div>
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
