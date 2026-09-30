import { Link2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function PendingLinkState() {
  const { t } = useTranslation('banking');
  return (
    <section className="pending-link" role="status">
      <span>
        <Link2 size={24} />
      </span>
      <div>
        <h1>{t('pending')}</h1>
        <p>{t('pendingBody')}</p>
      </div>
    </section>
  );
}
