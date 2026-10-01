import { Landmark, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { ActivityChart } from '@/features/dashboard/components/ActivityChart';
import { BankingActivityList, DashboardMetric, DashboardSection } from '@/features/dashboard/components/DashboardPrimitives';
import type { ManagerDashboardData } from '@/features/dashboard/types/dashboard';
import { PageHeader } from '@/shared/components/PageHeader';
import { formatCurrency } from '@/shared/utils/currency';

export function ManagerDashboard({ data }: { data: ManagerDashboardData }) {
  const { t } = useTranslation('dashboard');
  const accountTotal = Math.max(1, data.accountCount);
  return (
    <div className="role-dashboard role-dashboard--manager">
      <PageHeader
        eyebrow={t('manager.eyebrow')}
        title={t('manager.title')}
        description={t('manager.description')}
        actions={
          <Link className="button" to={appPath('/transfer')}>
            {t('actions.transfer')}
          </Link>
        }
      />
      <section className="dashboard-metrics dashboard-metrics--manager" aria-label={t('manager.bankPosition')}>
        <DashboardMetric label={t('metrics.totalBankBalance')} value={formatCurrency(Number(data.totalBankBalance))} icon={Landmark} />
        <DashboardMetric label={t('metrics.customers')} value={data.customerCount} icon={Users} />
        <DashboardMetric label={t('metrics.accounts')} value={data.accountCount} icon={WalletCards} />
        <DashboardMetric
          label={t('metrics.premiumAccounts')}
          value={data.premiumAccountCount}
          icon={ShieldCheck}
          detail={t('manager.premiumDefinition')}
        />
      </section>
      <section className="dashboard-metrics dashboard-metrics--movement" aria-label={t('manager.movementSnapshot')}>
        <DashboardMetric
          label={t('metrics.depositVolume')}
          value={formatCurrency(Number(data.last30DayDepositVolume))}
          detail={t('period.last30Days')}
        />
        <DashboardMetric
          label={t('metrics.withdrawalVolume')}
          value={formatCurrency(Number(data.last30DayWithdrawalVolume))}
          detail={t('period.last30Days')}
        />
        <DashboardMetric
          label={t('metrics.transferVolume')}
          value={formatCurrency(Number(data.last30DayTransferVolume))}
          detail={t('period.last30Days')}
        />
      </section>
      <div className="dashboard-layout dashboard-layout--manager">
        <DashboardSection title={t('chart.managerTitle')} description={t('chart.managerDescription')}>
          <ActivityChart data={data.moneyMovementSeries} includeTransfers />
        </DashboardSection>
        <DashboardSection title={t('manager.accountMixTitle')} description={t('manager.accountMixDescription')}>
          <div className="account-mix">
            <MixRow label={t('manager.checking')} count={data.checkingCount} total={accountTotal} className="account-mix--checking" />
            <MixRow label={t('manager.savings')} count={data.savingsCount} total={accountTotal} className="account-mix--savings" />
            <MixRow label={t('manager.premium')} count={data.premiumAccountCount} total={accountTotal} className="account-mix--premium" />
          </div>
        </DashboardSection>
      </div>
      <DashboardSection
        title={t('manager.recentTitle')}
        description={t('manager.recentDescription')}
        action={<Link to={appPath('/audits')}>{t('actions.viewAudit')}</Link>}
      >
        <BankingActivityList activity={data.recentBankingAudits} emptyMessage={t('empty.managerActivityBody')} />
      </DashboardSection>
    </div>
  );
}

function MixRow({ label, count, total, className }: { label: string; count: number; total: number; className: string }) {
  return (
    <div className={`account-mix__row ${className}`}>
      <div>
        <span>{label}</span>
        <strong>{count}</strong>
      </div>
      <div className="account-mix__track" aria-hidden="true">
        <span style={{ width: `${(count / total) * 100}%` }} />
      </div>
    </div>
  );
}
