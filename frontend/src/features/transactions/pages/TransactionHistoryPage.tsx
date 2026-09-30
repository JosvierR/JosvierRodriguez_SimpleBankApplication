import { appPath } from '@/app/routes';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type { AccountResponse, TransactionResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function TransactionHistoryPage() {
  const { accountId = '' } = useParams();
  const [data, setData] = useState<{ account: AccountResponse; transactions: TransactionResponse[] } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [account, transactions] = await Promise.all([accountsApi.get(accountId), accountsApi.transactions(accountId)]);
      setData({ account, transactions });
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [accountId]);
  useEffect(() => {
    void load();
  }, [load]);
  if (error) return <ErrorState title="Transactions unavailable" message={error} onRetry={() => void load()} />;
  if (!data) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath(`/accounts/${accountId}`)}>
        <ArrowLeft size={16} />
        Back to account
      </Link>
      <PageHeader
        title="Transaction history"
        description={`${data.account.userName} · ${accountId}`}
        actions={
          <span className="header-balance">
            <small>Current balance</small>
            <strong>{formatCurrency(Number(data.account.balance))}</strong>
          </span>
        }
      />
      <section className="grouped-section">
        {data.transactions.length === 0 ? (
          <EmptyState title="No transactions yet" message="Deposits and withdrawals for this account will appear here." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Type</th>
                  <th className="money-cell">Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((transaction) => {
                  const deposit = transaction.type === 'DEPOSIT';
                  const Icon = deposit ? ArrowDownToLine : ArrowUpFromLine;
                  return (
                    <tr key={transaction.transactionId}>
                      <td className="mono">{transaction.transactionId}</td>
                      <td>
                        <span className={`transaction-type transaction-type--${deposit ? 'positive' : 'negative'}`}>
                          <Icon size={15} />
                          {deposit ? 'Deposit' : 'Withdraw'}
                        </span>
                      </td>
                      <td className={`money-cell money ${deposit ? 'positive' : 'negative'}`}>
                        {deposit ? '+' : '-'}
                        {formatCurrency(Math.abs(Number(transaction.amount)))}
                      </td>
                      <td>{formatDateTime(transaction.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
