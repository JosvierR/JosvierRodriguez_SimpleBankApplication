import * as Dialog from '@radix-ui/react-dialog';
import { Building2, Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { APP_HOME } from '@/app/routes';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { StagingBadge } from '@/shared/components/StagingBadge';

export interface PublicHeaderProps {
  isAuthenticated: boolean;
  environment?: string;
}

export function PublicHeader({ isAuthenticated, environment }: PublicHeaderProps) {
  const { t } = useTranslation(['landing', 'common', 'auth']);
  const accessLabel = isAuthenticated ? t('common:openApp') : t('auth:signIn');
  const accessPath = isAuthenticated ? APP_HOME : '/login';

  return (
    <header className="landing__header">
      <a className="landing__brand" href="#top" aria-label="Simple Bank">
        <span>
          <Building2 size={18} aria-hidden="true" />
        </span>
        <strong>Simple Bank</strong>
        <StagingBadge environment={environment} />
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
