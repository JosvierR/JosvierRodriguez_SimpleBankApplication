import { ArrowDownToLine, ArrowUpFromLine, Search, UserRoundSearch, Users, WalletCards } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { BankingActivityList, DashboardMetric, DashboardSection } from '@/features/dashboard/components/DashboardPrimitives';
import type { TellerDashboardData } from '@/features/dashboard/types/dashboard';
import { PageHeader } from '@/shared/components/PageHeader';
import { formatCurrency } from '@/shared/utils/currency';

export function TellerDashboard({ data }: { data: TellerDashboardData }) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  function search(event: FormEvent, destination = 'customers') {
    event.preventDefault();
    const suffix = query.trim() ? `?query=${encodeURIComponent(query.trim())}` : '';
    navigate(appPath(`/${destination}${suffix}`));
  }
  return (
    <div className="role-dashboard role-dashboard--teller">
      <PageHeader eyebrow={t('teller.eyebrow')} title={t('teller.title', { name: data.username })} description={t('teller.description')} />
      <DashboardSection title={t('teller.searchTitle')} description={t('teller.searchDescription')} className="dashboard-search-section">
        <form className="dashboard-search" onSubmit={(event) => search(event)}>
          <label className="sr-only" htmlFor="dashboard-service-search">
            {t('teller.searchLabel')}
          </label>
          <div className="dashboard-search__field">
            <Search size={18} aria-hidden="true" />
            <input
              id="dashboard-service-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('teller.searchPlaceholder')}
            />
          </div>
          <button className="button" type="submit">
            <Users size={17} aria-hidden="true" />
            {t('actions.findCustomer')}
          </button>
          <button className="button button--secondary" type="button" onClick={(event) => search(event, 'accounts')}>
            <WalletCards size={17} aria-hidden="true" />
            {t('actions.findAccount')}
          </button>
        </form>
      </DashboardSection>
      <section className="dashboard-metrics" aria-label={t('teller.todaySnapshot')}>
        <DashboardMetric
          label={t('metrics.myOperationsToday')}
          value={data.myOperationsToday}
          icon={UserRoundSearch}
          detail={t('period.todayUtc')}
        />
        <DashboardMetric
          label={t('metrics.myDepositsToday')}
          value={formatCurrency(Number(data.myDepositsTodayAmount))}
          icon={ArrowDownToLine}
          detail={t('period.todayUtc')}
        />
        <DashboardMetric
          label={t('metrics.myWithdrawalsToday')}
          value={formatCurrency(Number(data.myWithdrawalsTodayAmount))}
          icon={ArrowUpFromLine}
          detail={t('period.todayUtc')}
        />
        <DashboardMetric
          label={t('metrics.newAccountsToday')}
          value={data.newAccountsToday}
          icon={WalletCards}
          detail={t('period.todayUtc')}
        />
      </section>
      <div className="dashboard-quick-actions" aria-label={t('actions.quickActions')}>
        <Link className="button" to={appPath('/accounts/new')}>
          {t('actions.openAccount')}
        </Link>
        <Link className="button button--secondary" to={appPath('/customers')}>
          {t('actions.customers')}
        </Link>
        <Link className="button button--secondary" to={appPath('/accounts')}>
          {t('actions.accounts')}
        </Link>
      </div>
      <DashboardSection title={t('teller.recentTitle')} description={t('teller.recentDescription')}>
        <BankingActivityList activity={data.myRecentOperations} showActor={false} emptyMessage={t('empty.tellerActivityBody')} />
      </DashboardSection>
      <p className="dashboard-context-note">{t('teller.scopeNote', { customers: data.customerCount, accounts: data.accountCount })}</p>
    </div>
  );
}
