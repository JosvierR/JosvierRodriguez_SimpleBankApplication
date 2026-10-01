import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';

export interface PublicFooterProps {
  credentialsUrl: string;
  repositoryUrl: string;
}

export function PublicFooter({ credentialsUrl, repositoryUrl }: PublicFooterProps) {
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
        <a href={credentialsUrl}>{t('demoAccounts')}</a>
        <a href={repositoryUrl}>{t('repository')}</a>
      </div>
    </footer>
  );
}
