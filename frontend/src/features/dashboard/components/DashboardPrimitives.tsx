import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { DashboardBankingActivity, DashboardRoleCount, DashboardSecurityActivity } from '@/features/dashboard/types/dashboard';
import { EmptyState } from '@/shared/components/States';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';

export function DashboardMetric({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon?: ComponentType<{ size?: number }>;
}) {
  return (
    <article className="dashboard-metric">
      <span>
        {Icon ? <Icon size={16} /> : null}
        {label}
      </span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dashboard-section ${className}`.trim()}>
      <header className="dashboard-section__header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function BankingActivityList({
  activity,
  showActor = true,
  emptyMessage,
}: {
  activity: DashboardBankingActivity[];
  showActor?: boolean;
  emptyMessage: string;
}) {
  const { t } = useTranslation(['dashboard', 'banking']);
  if (activity.length === 0) {
    return <EmptyState title={t('dashboard:empty.noActivity')} message={emptyMessage} />;
  }
  return (
    <div className="dashboard-activity-list">
      {activity.map((item, index) => (
        <div className="dashboard-activity" key={`${item.createdAt}-${item.action}-${index}`}>
          <span className={`activity-marker activity-marker--${item.action.toLowerCase()}`} aria-hidden="true" />
          <div className="dashboard-activity__primary">
            <strong>{t(`banking:transaction.${item.action}`)}</strong>
            <span>
              {item.customerName}
              {item.accountSuffixes.length > 0 ? ` · •••• ${item.accountSuffixes.join(', •••• ')}` : ''}
            </span>
            {showActor ? (
              <small>{t('dashboard:activity.byActor', { actor: item.actorUsername || t('dashboard:activity.system') })}</small>
            ) : null}
          </div>
          <div className="dashboard-activity__value">
            <strong>{formatCurrency(Number(item.amount))}</strong>
            <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SecurityActivityList({ activity, emptyMessage }: { activity: DashboardSecurityActivity[]; emptyMessage: string }) {
  const { t } = useTranslation(['dashboard', 'admin']);
  if (activity.length === 0) {
    return <EmptyState title={t('dashboard:empty.noSecurityActivity')} message={emptyMessage} />;
  }
  return (
    <div className="dashboard-activity-list">
      {activity.map((item, index) => (
        <div className="dashboard-activity" key={`${item.createdAt}-${item.action}-${index}`}>
          <span className="activity-marker activity-marker--security" aria-hidden="true" />
          <div className="dashboard-activity__primary">
            <strong>{t(`admin:auditAction.${item.action}`)}</strong>
            <span>{item.targetUsername}</span>
            <small>{t('dashboard:activity.byActor', { actor: item.actorUsername })}</small>
          </div>
          <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
        </div>
      ))}
    </div>
  );
}

export function DistributionBars({ items }: { items: DashboardRoleCount[] }) {
  const { t } = useTranslation(['dashboard', 'common']);
  const largest = Math.max(1, ...items.map((item) => item.count));
  return (
    <div className="distribution-list" aria-label={t('dashboard:admin.roleDistribution')}>
      {items.map((item) => (
        <div className="distribution-row" key={item.role}>
          <div>
            <span>{t(`common:roles.${item.role}`)}</span>
            <strong>{item.count}</strong>
          </div>
          <div className="distribution-track" aria-hidden="true">
            <span style={{ width: `${(item.count / largest) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
