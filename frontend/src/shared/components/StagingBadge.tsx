import { useTranslation } from 'react-i18next';

export function StagingBadge({ environment }: { environment?: string | null }) {
  const { t } = useTranslation('common');
  if (environment !== 'staging') return null;
  return <span className="staging-badge">{t('stagingBadge')}</span>;
}
