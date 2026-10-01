import { appPath } from '@/app/routes';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { usersApi } from '@/features/customers/api/usersApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type { AccountResponse, UserResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function CustomerDetailsPage() {
  const { t } = useTranslation('banking');
  const { primaryRole } = useAuth();
  const canOpen = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const { userId = '' } = useParams();
  const [data, setData] = useState<{ user: UserResponse; accounts: AccountResponse[] } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [user, accounts] = await Promise.all([usersApi.get(userId), usersApi.accounts(userId)]);
      setData({ user, accounts });
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [userId]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <ErrorState title={t('customerUnavailable')} message={error} onRetry={() => void load()} />;
  if (!data) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath('/customers')}>
        <ArrowLeft size={16} />
        Customers
      </Link>
      <PageHeader
        title={data.user.name}
        description={data.user.email}
        actions={
          canOpen && (
            <Link className="button" to={appPath(`/accounts/new?userId=${data.user.id}`)}>
              <Plus size={17} />
              Open another account
            </Link>
          )
        }
      />
      <section className="details-grid">
        <article className="grouped-section">
          <h2>{t('customerDetails')}</h2>
          <dl className="details-list">
            <div>
              <dt>{t('customerId')}</dt>
              <dd className="mono">{data.user.id}</dd>
            </div>
            <div>
              <dt>{t('name')}</dt>
              <dd>{data.user.name}</dd>
            </div>
            <div>
              <dt>{t('email')}</dt>
              <dd>{data.user.email}</dd>
            </div>
            <div>
              <dt>{t('created')}</dt>
              <dd>{formatDateTime(data.user.createdAt)}</dd>
            </div>
          </dl>
        </article>
        <article className="grouped-section panel--wide">
          <div className="section-heading">
            <div>
              <h2>{t('accounts')}</h2>
              <p>{t('customerAccountCount', { count: data.accounts.length })}</p>
            </div>
          </div>
          {data.accounts.length === 0 ? (
            <EmptyState
              title={t('noAccounts')}
              message={t('noCustomerAccounts')}
              action={
                canOpen && (
                  <Link className="button" to={appPath(`/accounts/new?userId=${data.user.id}`)}>
                    {t('openAccount')}
                  </Link>
                )
              }
            />
          ) : (
            <div className="account-card-list">
              {data.accounts.map((account) => (
                <Link to={appPath(`/accounts/${account.accountId}`)} className="account-card-row" key={account.accountId}>
                  <div>
                    <span>{account.accountType === 'CHECKING' ? 'Checking' : 'Savings'}</span>
                    <strong className="mono">{account.accountId}</strong>
                  </div>
                  <div>
                    <small>{t('balance')}</small>
                    <strong className="money">{formatCurrency(Number(account.balance))}</strong>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  );
}
