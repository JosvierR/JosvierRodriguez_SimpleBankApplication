import { CircleAlert, Inbox, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ErrorState({ title, message, onRetry }: { title?: string; message: string; onRetry?: () => void }) {
  const { t } = useTranslation(['common', 'banking']);
  const heading = title ?? t('banking:unableToLoad');
  return (
    <div className="state state--error" role="alert">
      <CircleAlert size={24} />
      <div>
        <h2>{heading}</h2>
        <p>{message}</p>
        {onRetry && (
          <button className="button button--secondary button--small" onClick={onRetry}>
            <RefreshCw size={15} />
            {t('common:retry')}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <Inbox size={28} />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}

export function PageLoading({ rows = 4 }: { rows?: number }) {
  const { t } = useTranslation('common');
  return (
    <div className="loading-stack" role="status" aria-label={t('loading')}>
      <div className="skeleton skeleton--title" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton skeleton--row" key={index} />
      ))}
    </div>
  );
}
