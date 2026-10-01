import { ArrowLeftRight, Landmark, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { ActivityChart } from '@/features/dashboard/components/ActivityChart';
import { DashboardMetric, DashboardSection } from '@/features/dashboard/components/DashboardPrimitives';
import type { CustomerDashboardData } from '@/features/dashboard/types/dashboard';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { EmptyState } from '@/shared/components/States';
import { PageHeader } from '@/shared/components/PageHeader';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';

export function CustomerDashboard({ data }: { data: CustomerDashboardData }) {
  const { t } = useTranslation(['dashboard', 'banking']);
  if (!data.bankUserLinked) return <PendingLinkState />;
  return (
    <div className="role-dashboard role-dashboard--customer">
      <PageHeader
        eyebrow={t('dashboard:customer.eyebrow')}
        title={t('dashboard:customer.title', { name: data.displayName })}
        description={t('dashboard:customer.description')}
        actions={
          <Link className="button" to={appPath('/my-transfer')}>
            <ArrowLeftRight size={17} aria-hidden="true" />
            {t('dashboard:actions.transfer')}
          </Link>
        }
      />
      <section className="dashboard-metrics dashboard-metrics--customer" aria-label={t('dashboard:customer.position')}>
        <DashboardMetric label={t('dashboard:metrics.totalBalance')} value={formatCurrency(Number(data.totalBalance))} icon={Landmark} />
        <DashboardMetric label={t('dashboard:metrics.accounts')} value={data.accountCount} icon={WalletCards} />
        <DashboardMetric
          label={t('dashboard:metrics.deposits30')}
          value={formatCurrency(Number(data.last30DayDeposits))}
          detail={t('dashboard:period.last30Days')}
        />
        <DashboardMetric
          label={t('dashboard:metrics.withdrawals30')}
          value={formatCurrency(Number(data.last30DayWithdrawals))}
          detail={t('dashboard:period.last30Days')}
        />
        <DashboardMetric
          label={t('dashboard:metrics.transfersIn30')}
          value={formatCurrency(Number(data.last30DayTransfersIn))}
          detail={t('dashboard:period.last30Days')}
        />
        <DashboardMetric
          label={t('dashboard:metrics.transfersOut30')}
          value={formatCurrency(Number(data.last30DayTransfersOut))}
          detail={t('dashboard:period.last30Days')}
        />
      </section>
      <div className="dashboard-layout dashboard-layout--balanced">
        <DashboardSection
          title={t('dashboard:customer.accountsTitle')}
          description={t('dashboard:customer.accountsDescription')}
          action={<Link to={appPath('/my-accounts')}>{t('dashboard:actions.viewAccounts')}</Link>}
        >
          {data.accounts.length === 0 ? (
            <EmptyState title={t('dashboard:empty.noAccounts')} message={t('dashboard:empty.noAccountsBody')} />
          ) : (
            <div className="dashboard-account-list">
              {data.accounts.map((account) => (
                <Link to={appPath(`/my-accounts/${account.accountId}`)} key={account.accountId} className="dashboard-account-row">
                  <div>
                    <strong>{t(`banking:accountType.${account.accountType}`)}</strong>
                    <span className="mono">•••• {account.accountId.slice(-4)}</span>
                  </div>
                  <strong>{formatCurrency(Number(account.balance))}</strong>
                </Link>
              ))}
            </div>
          )}
        </DashboardSection>
        <DashboardSection title={t('dashboard:chart.customerTitle')} description={t('dashboard:chart.customerDescription')}>
          <ActivityChart data={data.activitySeries} includeTransfers />
        </DashboardSection>
      </div>
      <DashboardSection title={t('dashboard:customer.recentTitle')} description={t('dashboard:customer.recentDescription')}>
        {data.recentTransactions.length === 0 ? (
          <EmptyState title={t('dashboard:empty.noActivity')} message={t('dashboard:empty.customerActivityBody')} />
        ) : (
          <div className="dashboard-activity-list">
            {data.recentTransactions.map((transaction, index) => {
              const incoming = transaction.type === 'DEPOSIT' || transaction.type === 'TRANSFER_IN';
              const transfer =
                transaction.type === 'TRANSFER_IN' || transaction.type === 'TRANSFER_OUT' || transaction.counterpartyDisplayName;
              const label = transfer
                ? t(incoming ? 'banking:transferInFrom' : 'banking:transferOutTo', { name: transaction.counterpartyDisplayName || '' })
                : t(`banking:transaction.${transaction.type}`);
              return (
                <div className="dashboard-activity" key={`${transaction.createdAt}-${index}`}>
                  <span className={`activity-marker activity-marker--${incoming ? 'deposit' : 'withdraw'}`} aria-hidden="true" />
                  <div className="dashboard-activity__primary">
                    <strong>{label}</strong>
                    <span className="mono">{transaction.counterpartyAccountNumberMasked || `•••• ${transaction.accountSuffix}`}</span>
                  </div>
                  <div className="dashboard-activity__value">
                    <strong className={incoming ? 'positive' : 'negative'}>
                      {incoming ? '+' : '−'}
                      {formatCurrency(Math.abs(Number(transaction.amount)))}
                    </strong>
                    <time dateTime={transaction.createdAt}>{formatDateTime(transaction.createdAt)}</time>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
