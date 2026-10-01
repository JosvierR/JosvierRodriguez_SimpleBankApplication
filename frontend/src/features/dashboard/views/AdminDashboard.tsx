import { Link2, ShieldCheck, ShieldOff, UsersRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { appPath } from '@/app/routes';
import {
  BankingActivityList,
  DashboardMetric,
  DashboardSection,
  DistributionBars,
  SecurityActivityList,
} from '@/features/dashboard/components/DashboardPrimitives';
import type { AdminDashboardData } from '@/features/dashboard/types/dashboard';
import { PageHeader } from '@/shared/components/PageHeader';

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { t } = useTranslation('dashboard');
  return (
    <div className="role-dashboard role-dashboard--admin">
      <PageHeader
        eyebrow={t('admin.eyebrow')}
        title={t('admin.title')}
        description={t('admin.description')}
        actions={
          <div className="dashboard-header-actions">
            <Link className="button" to={appPath('/admin/access')}>
              {t('actions.manageAccess')}
            </Link>
            <Link className="button button--secondary" to={appPath('/admin/security-audit')}>
              {t('actions.securityAudit')}
            </Link>
          </div>
        }
      />
      <section className="dashboard-metrics dashboard-metrics--admin" aria-label={t('admin.identityHealth')}>
        <DashboardMetric label={t('metrics.activeIdentities')} value={data.activeAuthUsers} icon={ShieldCheck} />
        <DashboardMetric label={t('metrics.disabledIdentities')} value={data.disabledAuthUsers} icon={ShieldOff} />
        <DashboardMetric label={t('metrics.linkedCustomers')} value={data.linkedCustomerIdentities} icon={Link2} />
        <DashboardMetric label={t('metrics.unlinkedCustomers')} value={data.unlinkedCustomerIdentities} icon={UsersRound} />
      </section>
      <div className="dashboard-layout dashboard-layout--admin">
        <DashboardSection title={t('admin.roleDistribution')} description={t('admin.roleDistributionDescription')}>
          <DistributionBars items={data.roleDistribution} />
        </DashboardSection>
        <DashboardSection title={t('admin.bankOverview')} description={t('admin.bankOverviewDescription')}>
          <dl className="dashboard-definition-list">
            <div>
              <dt>{t('metrics.customers')}</dt>
              <dd>{data.customerCount}</dd>
            </div>
            <div>
              <dt>{t('metrics.accounts')}</dt>
              <dd>{data.accountCount}</dd>
            </div>
            <div>
              <dt>{t('metrics.linkCoverage')}</dt>
              <dd>{linkCoverage(data.linkedCustomerIdentities, data.unlinkedCustomerIdentities)}</dd>
            </div>
          </dl>
        </DashboardSection>
      </div>
      <div className="dashboard-layout dashboard-layout--admin-activity">
        <DashboardSection
          title={t('admin.securityTitle')}
          description={t('admin.securityDescription')}
          action={<Link to={appPath('/admin/security-audit')}>{t('actions.viewAll')}</Link>}
        >
          <SecurityActivityList activity={data.recentSecurityAudits} emptyMessage={t('empty.securityActivityBody')} />
        </DashboardSection>
        <DashboardSection
          title={t('admin.bankingTitle')}
          description={t('admin.bankingDescription')}
          action={<Link to={appPath('/audits')}>{t('actions.viewAudit')}</Link>}
        >
          <BankingActivityList activity={data.recentBankingAudits} emptyMessage={t('empty.managerActivityBody')} />
        </DashboardSection>
      </div>
    </div>
  );
}

function linkCoverage(linked: number, unlinked: number) {
  const total = linked + unlinked;
  return total === 0 ? '—' : `${Math.round((linked / total) * 100)}%`;
}
