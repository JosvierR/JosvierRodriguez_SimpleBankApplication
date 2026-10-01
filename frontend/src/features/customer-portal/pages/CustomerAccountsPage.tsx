import { appPath } from '@/app/routes';
import { ArrowLeft, ArrowLeftRight, History } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { meApi } from '@/features/customer-portal/api/meApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type { CustomerAccountResponse, CustomerTransactionResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function MyAccountsPage() {
  const { t } = useTranslation(['banking', 'common']);
  const { bankUserLinked } = useAuth();
  const [accounts, setAccounts] = useState<CustomerAccountResponse[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setAccounts(await meApi.accounts());
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    if (bankUserLinked) void load();
  }, [bankUserLinked, load]);
  if (!bankUserLinked) return <PendingLinkState />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!accounts) return <PageLoading />;
  return (
    <>
      <PageHeader title={t('common:nav.myAccounts')} />
      {accounts.length === 0 ? (
        <EmptyState title={t('noAccounts')} message={t('noAccountsBody')} />
      ) : (
        <section className="customer-account-grid">
          {accounts.map((account) => (
            <Link className="customer-account" to={appPath(`/my-accounts/${account.accountId}`)} key={account.accountId}>
              <div>
                <span>{t(`accountType.${account.accountType}`)}</span>
                <small className="mono">•••• {account.accountId.slice(-4)}</small>
              </div>
              <strong>{formatCurrency(Number(account.balance))}</strong>
              <small>{t('openedOn', { date: formatDateTime(account.createdAt) })}</small>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}

export function MyAccountDetailsPage() {
  const { t } = useTranslation(['banking', 'common']);
  const { accountId = '' } = useParams();
  const { bankUserLinked } = useAuth();
  const [data, setData] = useState<{ account: CustomerAccountResponse; transactions: CustomerTransactionResponse[] } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [account, transactions] = await Promise.all([meApi.account(accountId), meApi.transactions(accountId)]);
      setData({ account, transactions });
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [accountId]);
  useEffect(() => {
    if (bankUserLinked) void load();
  }, [bankUserLinked, load]);
  if (!bankUserLinked) return <PendingLinkState />;
  if (error) return <ErrorState title={t('accountUnavailable')} message={error} onRetry={() => void load()} />;
  if (!data) return <PageLoading />;
  const recent = [...data.transactions].reverse().slice(0, 5);
  return (
    <>
      <Link className="back-link" to={appPath('/my-accounts')}>
        <ArrowLeft size={16} />
        {t('common:nav.myAccounts')}
      </Link>
      <PageHeader
        title={data.account.accountType === 'CHECKING' ? t('checkingAccount') : t('savingsAccount')}
        description={t('accountEnding', { id: data.account.accountId.slice(-4) })}
      />
      <section className="customer-balance">
        <span>{t('availableBalance')}</span>
        <strong>{formatCurrency(Number(data.account.balance))}</strong>
        <div>
          <Link className="button" to={appPath(`/my-transfer?from=${accountId}`)}>
            <ArrowLeftRight size={17} />
            {t('common:nav.transfer')}
          </Link>
          <Link className="button button--secondary" to={appPath(`/my-accounts/${accountId}/transactions`)}>
            <History size={17} />
            {t('transactions')}
          </Link>
        </div>
      </section>
      <section className="grouped-section">
        <div className="section-heading">
          <h2>{t('recentActivity')}</h2>
          <Link to={appPath(`/my-accounts/${accountId}/transactions`)}>{t('viewAll')}</Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState title={t('noTransactions')} message={t('activityWillAppear')} />
        ) : (
          <TransactionRows transactions={recent} />
        )}
      </section>
    </>
  );
}

export function MyTransactionsPage() {
  const { t } = useTranslation(['banking', 'common']);
  const { accountId = '' } = useParams();
  const { bankUserLinked } = useAuth();
  const [transactions, setTransactions] = useState<CustomerTransactionResponse[] | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setTransactions(await meApi.transactions(accountId));
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [accountId]);
  useEffect(() => {
    if (bankUserLinked) void load();
  }, [bankUserLinked, load]);
  if (!bankUserLinked) return <PendingLinkState />;
  if (error) return <ErrorState title={t('transactionsUnavailable')} message={error} onRetry={() => void load()} />;
  if (!transactions) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath(`/my-accounts/${accountId}`)}>
        <ArrowLeft size={16} />
        {t('backToAccount')}
      </Link>
      <PageHeader title={t('transactions')} description={t('accountEnding', { id: accountId.slice(-4) })} />
      <section className="grouped-section">
        {transactions.length === 0 ? (
          <EmptyState title={t('noTransactions')} message={t('activityWillAppear')} />
        ) : (
          <TransactionRows transactions={[...transactions].reverse()} />
        )}
      </section>
    </>
  );
}

function TransactionRows({ transactions }: { transactions: CustomerTransactionResponse[] }) {
  const { t } = useTranslation('banking');
  return (
    <div className="customer-transactions">
      {transactions.map((transaction) => {
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
  );
}
