import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  const { t } = useTranslation('banking');
  return (
    <main className="not-found">
      <p className="eyebrow">404</p>
      <h1>{t('pageNotFound')}</h1>
      <p>{t('pageNotFoundBody')}</p>
      <Link className="button" to="/">
        {t('returnHome')}
      </Link>
    </main>
  );
}
