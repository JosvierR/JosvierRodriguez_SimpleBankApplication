import { ClipboardCheck, Users, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { BankingActivityList, DashboardMetric, DashboardSection } from '@/features/dashboard/components/DashboardPrimitives';
import type { AuditorDashboardData } from '@/features/dashboard/types/dashboard';
import { PageHeader } from '@/shared/components/PageHeader';

export function AuditorDashboard({ data }: { data: AuditorDashboardData }) {
  const { t } = useTranslation('dashboard');
  const breakdown = [
    { label: t('chart.deposits'), value: data.depositAuditCount, className: 'deposit' },
    { label: t('chart.withdrawals'), value: data.withdrawAuditCount, className: 'withdraw' },
    { label: t('chart.transfers'), value: data.transferAuditCount, className: 'transfer' },
  ];
  const largest = Math.max(1, ...breakdown.map((item) => item.value));
  return (
    <div className="role-dashboard role-dashboard--auditor">
      <PageHeader
        eyebrow={t('auditor.eyebrow')}
        title={t('auditor.title')}
        description={t('auditor.description')}
        actions={
          <Link className="button" to={appPath('/audits')}>
            {t('actions.openAuditLog')}
          </Link>
        }
      />
      <div className="dashboard-readonly-note">
        <ClipboardCheck size={18} aria-hidden="true" />
        <span>{t('auditor.readOnly')}</span>
      </div>
      <section className="dashboard-metrics" aria-label={t('auditor.coverage')}>
        <DashboardMetric label={t('metrics.auditRecords30')} value={data.auditRecordsLast30Days} detail={t('period.last30Days')} />
        <DashboardMetric label={t('metrics.distinctActors30')} value={data.distinctActorsLast30Days} detail={t('period.last30Days')} />
        <DashboardMetric label={t('metrics.customers')} value={data.customerCount} icon={Users} />
        <DashboardMetric label={t('metrics.accounts')} value={data.accountCount} icon={WalletCards} />
      </section>
      <div className="dashboard-layout dashboard-layout--audit">
        <DashboardSection title={t('auditor.breakdownTitle')} description={t('auditor.breakdownDescription')}>
          <div className="audit-breakdown">
            {breakdown.map((item) => (
              <div className={`audit-breakdown__row audit-breakdown__row--${item.className}`} key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
                <div aria-hidden="true">
                  <span style={{ width: `${(item.value / largest) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
        <DashboardSection title={t('auditor.reviewTitle')} description={t('auditor.reviewDescription')}>
          <div className="dashboard-link-list">
            <Link to={appPath('/audits')}>
              {t('actions.openAuditLog')}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to={appPath('/customers')}>
              {t('actions.reviewCustomers')}
              <span aria-hidden="true">→</span>
            </Link>
            <Link to={appPath('/accounts')}>
              {t('actions.reviewAccounts')}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </DashboardSection>
      </div>
      <DashboardSection title={t('auditor.recentTitle')} description={t('auditor.recentDescription')}>
        <BankingActivityList activity={data.recentBankingAudits} emptyMessage={t('empty.auditorActivityBody')} />
      </DashboardSection>
    </div>
  );
}
