import { appPath } from '@/app/routes';
import { ArrowLeftRight, Landmark, ShieldCheck, Users, WalletCards } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { adminApi } from '@/features/access-management/api/adminApi';
import { auditsApi } from '@/features/audits/api/auditsApi';
import { meApi } from '@/features/customer-portal/api/meApi';
import { usersApi } from '@/features/customers/api/usersApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type {
  AccountResponse,
  AdminAuthUserResponse,
  AuditResponse,
  CustomerAccountResponse,
  CustomerTransactionResponse,
  SecurityAuditResponse,
  UserResponse,
} from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

interface DashboardData {
  users: UserResponse[];
  accounts: AccountResponse[];
  audits: AuditResponse[];
  authUsers: AdminAuthUserResponse[];
  securityAudits: SecurityAuditResponse[];
  ownAccounts: CustomerAccountResponse[];
  ownTransactions: CustomerTransactionResponse[];
}

const empty: DashboardData = {
  users: [],
  accounts: [],
  audits: [],
  authUsers: [],
  securityAudits: [],
  ownAccounts: [],
  ownTransactions: [],
};

export function DashboardPage() {
  const { primaryRole, bankUserLinked } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!primaryRole || (primaryRole === 'CUSTOMER' && !bankUserLinked)) return;
    setError('');
    try {
      if (primaryRole === 'CUSTOMER') {
        const ownAccounts = await meApi.accounts();
        const histories = await Promise.all(ownAccounts.map((account) => meApi.transactions(account.accountId)));
        setData({ ...empty, ownAccounts, ownTransactions: histories.flat() });
        return;
      }
      const [users, accounts] = await Promise.all([usersApi.list(), accountsApi.list()]);
      if (primaryRole === 'TELLER') {
        setData({ ...empty, users, accounts });
        return;
      }
      const audits = await auditsApi.list();
      if (primaryRole !== 'ADMIN') {
        setData({ ...empty, users, accounts, audits });
        return;
      }
      const [authUsers, securityAudits] = await Promise.all([adminApi.users(), adminApi.securityAudits()]);
      setData({ ...empty, users, accounts, audits, authUsers, securityAudits });
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [primaryRole, bankUserLinked]);
  useEffect(() => {
    void load();
  }, [load]);
  if (primaryRole === 'CUSTOMER' && !bankUserLinked) return <PendingLinkState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data || !primaryRole) return <PageLoading rows={6} />;
  if (primaryRole === 'CUSTOMER') return <CustomerOverview accounts={data.ownAccounts} transactions={data.ownTransactions} />;
  return <StaffOverview role={primaryRole} data={data} />;
}

function CustomerOverview({
  accounts,
  transactions,
}: {
  accounts: CustomerAccountResponse[];
  transactions: CustomerTransactionResponse[];
}) {
  const { t } = useTranslation(['banking', 'common']);
  const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const recent = [...transactions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);
  return (
    <>
      <PageHeader title={t('common:nav.overview')} />
      <section className="overview-metrics">
        <div>
          <span>{t('totalBalance')}</span>
          <strong>{formatCurrency(total)}</strong>
        </div>
        <div>
          <span>{t('common:nav.myAccounts')}</span>
          <strong>{accounts.length}</strong>
        </div>
        <div>
          <span>{t('recentTransactions')}</span>
          <strong>{recent.length}</strong>
        </div>
      </section>
      <div className="overview-actions">
        <Link className="button" to={appPath('/my-transfer')}>
          <ArrowLeftRight size={17} />
          {t('common:nav.transfer')}
        </Link>
        <Link className="button button--secondary" to={appPath('/my-accounts')}>
          {t('viewAll')}
        </Link>
      </div>
      <section className="grouped-section">
        <div className="section-heading">
          <h2>{t('recentActivity')}</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyState title={t('noRecent')} message={t('activityWillAppear')} />
        ) : (
          <div className="customer-transactions">
            {recent.map((transaction) => {
              const deposit = transaction.type === 'DEPOSIT';
              return (
                <div key={transaction.transactionId}>
                  <span className={`operation-dot operation-dot--${deposit ? 'deposit' : 'withdraw'}`} />
                  <div>
                    <strong>{deposit ? t('transaction.DEPOSIT') : t('transaction.WITHDRAW')}</strong>
                    <small>{formatDateTime(transaction.createdAt)}</small>
                  </div>
                  <strong className={deposit ? 'positive' : 'negative'}>
                    {deposit ? '+' : '-'}
                    {formatCurrency(Math.abs(Number(transaction.amount)))}
                  </strong>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function StaffOverview({
  role,
  data,
}: {
  role: Exclude<NonNullable<ReturnType<typeof useAuth>['primaryRole']>, 'CUSTOMER'>;
  data: DashboardData;
}) {
  const { t } = useTranslation(['banking', 'common']);
  const total = data.accounts.reduce((sum, account) => sum + Number(account.balance), 0);
  const recentAudits = [...data.audits].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6);
  const metrics =
    role === 'ADMIN'
      ? [
          { label: t('customers'), value: data.users.length, icon: Users },
          { label: t('accounts'), value: data.accounts.length, icon: WalletCards },
          { label: t('activeAccess'), value: data.authUsers.filter((user) => user.enabled).length, icon: ShieldCheck },
          { label: t('disabledAccess'), value: data.authUsers.filter((user) => !user.enabled).length, icon: ShieldCheck },
        ]
      : [
          { label: t('customers'), value: data.users.length, icon: Users },
          { label: t('accounts'), value: data.accounts.length, icon: WalletCards },
          { label: t('totalBalance'), value: formatCurrency(total), icon: Landmark },
          ...(role === 'TELLER' ? [] : [{ label: t('auditRecords'), value: data.audits.length, icon: ArrowLeftRight }]),
        ];
  const activity = role === 'ADMIN' ? data.securityAudits.slice(0, 6) : recentAudits;
  return (
    <>
      <PageHeader
        title={t('common:nav.overview')}
        actions={
          (role === 'TELLER' || role === 'MANAGER' || role === 'ADMIN') && (
            <Link className="button" to={appPath('/accounts/new')}>
              {t('openAccount')}
            </Link>
          )
        }
      />
      <section className="overview-metrics">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <span>
              <Icon size={16} />
              {label}
            </span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <div className="overview-actions">
        <Link className="button button--secondary" to={appPath('/customers')}>
          {t('customers')}
        </Link>
        <Link className="button button--secondary" to={appPath('/accounts')}>
          {t('accounts')}
        </Link>
        {(role === 'MANAGER' || role === 'ADMIN') && (
          <Link className="button" to={appPath('/transfer')}>
            {t('transferFunds')}
          </Link>
        )}
        {role === 'ADMIN' && (
          <Link className="button button--secondary" to={appPath('/admin/access')}>
            {t('manageAccess')}
          </Link>
        )}
      </div>
      {role !== 'TELLER' && (
        <section className="grouped-section">
          <div className="section-heading">
            <h2>{role === 'ADMIN' ? t('recentSecurity') : t('recentActivity')}</h2>
            {role === 'ADMIN' && <Link to={appPath('/admin/security-audit')}>{t('viewAll')}</Link>}
          </div>
          {activity.length === 0 ? (
            <EmptyState title={t('noRecent')} message={t('recordedActivity')} />
          ) : role === 'ADMIN' ? (
            <div className="activity-list">
              {data.securityAudits.slice(0, 6).map((audit) => (
                <div className="activity-row" key={audit.id}>
                  <span className="operation-dot" />
                  <div>
                    <strong>{audit.action.replaceAll('_', ' ')}</strong>
                    <small>{audit.actorUsername}</small>
                  </div>
                  <small>{formatDateTime(audit.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-list">
              {recentAudits.map((audit) => (
                <div className="activity-row" key={audit.id}>
                  <span className={`operation-dot operation-dot--${audit.action.toLowerCase()}`} />
                  <div>
                    <strong>{audit.action.replaceAll('_', ' ')}</strong>
                    <small>
                      {audit.userName} · {audit.actorUsername || 'Legacy / unavailable'}
                    </small>
                  </div>
                  <div>
                    <strong>{formatCurrency(Number(audit.amount))}</strong>
                    <small>{formatDateTime(audit.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
