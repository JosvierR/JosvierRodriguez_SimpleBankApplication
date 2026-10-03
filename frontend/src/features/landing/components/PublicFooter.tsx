import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export interface PublicFooterProps {
  credentialsUrl: string;
  credentialsLabel?: string;
  repositoryUrl: string;
}

export function PublicFooter({ credentialsUrl, credentialsLabel, repositoryUrl }: PublicFooterProps) {
  const { t } = useTranslation('landing');
  return (
    <footer className="landing__footer">
      <div>
        <a className="landing__brand" href="#top">
          <span>
            <Building2 size={16} aria-hidden="true" />
          </span>
          <strong>Simple Bank</strong>
        </a>
        <p>{t('footer')}</p>
      </div>
      <div>
        <LanguageSwitcher />
        <a href={credentialsUrl}>{credentialsLabel ?? t('demoAccounts')}</a>
        <a href={repositoryUrl}>{t('repository')}</a>
      </div>
    </footer>
  );
}
