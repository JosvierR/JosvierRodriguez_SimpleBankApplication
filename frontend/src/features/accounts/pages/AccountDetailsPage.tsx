import { appPath } from '@/app/routes';
import { ArrowDownToLine, ArrowLeft, ArrowLeftRight, ArrowUpFromLine, History, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { ApiError } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/useAuth';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { PageHeader } from '@/shared/components/PageHeader';
import { ErrorState, PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { AccountResponse, AccountType } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function AccountDetailsPage() {
  const { accountId = '' } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { primaryRole } = useAuth();
  const canCash = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const canManage = primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      setAccount(await accountsApi.get(accountId));
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, [accountId]);
  useEffect(() => {
    void load();
  }, [load]);
  async function updateType(value: AccountType) {
    if (!account || value === account.accountType) return;
    setUpdating(true);
    setError('');
    try {
      setAccount(await accountsApi.update(accountId, { accountType: value }));
      notify('Account type updated.');
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setUpdating(false);
    }
  }
  async function remove() {
    setUpdating(true);
    try {
      await accountsApi.delete(accountId);
      notify('Account deleted.');
      navigate(appPath('/accounts'));
    } catch (cause) {
      const message =
        cause instanceof ApiError && cause.status === 409 ? 'Accounts with transaction history cannot be deleted.' : getErrorMessage(cause);
      setError(message);
      notify(message, 'error');
      setConfirmDelete(false);
    } finally {
      setUpdating(false);
    }
  }
  if (error && !account) return <ErrorState title="Account unavailable" message={error} onRetry={() => void load()} />;
  if (!account) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath('/accounts')}>
        <ArrowLeft size={16} />
        Accounts
      </Link>
      <PageHeader title={account.userName} description={`Account ending ${account.accountId.slice(-6)}`} />
      <section className="balance-hero">
        <div>
          <span>Available balance</span>
          <strong>{formatCurrency(Number(account.balance))}</strong>
        </div>
        <div className="balance-actions">
          {canCash && (
            <>
              <Link className="button" to={appPath(`/accounts/${accountId}/deposit`)}>
                <ArrowDownToLine size={17} />
                Deposit
              </Link>
              <Link className="button button--secondary" to={appPath(`/accounts/${accountId}/withdraw`)}>
                <ArrowUpFromLine size={17} />
                Withdraw
              </Link>
            </>
          )}
          {canManage && (
            <Link className="button button--secondary" to={appPath(`/transfer?from=${accountId}`)}>
              <ArrowLeftRight size={17} />
              Transfer
            </Link>
          )}
          <Link className="button button--secondary" to={appPath(`/accounts/${accountId}/transactions`)}>
            <History size={17} />
            Transactions
          </Link>
        </div>
      </section>
      {error && (
        <div className="inline-notice inline-notice--error" role="alert">
          {error}
        </div>
      )}
      <section className="details-grid">
        <article className="grouped-section">
          <h2>Account information</h2>
          <dl className="details-list">
            <div>
              <dt>Account ID</dt>
              <dd className="mono">{account.accountId}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>
                <Link to={appPath(`/customers/${account.userId}`)}>{account.userName}</Link>
              </dd>
            </div>
            <div>
              <dt>Account type</dt>
              <dd>{account.accountType === 'CHECKING' ? 'Checking' : 'Savings'}</dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{formatDateTime(account.createdAt)}</dd>
            </div>
          </dl>
        </article>
        {canManage && (
          <article className="grouped-section">
            <h2>Account settings</h2>
            <label>
              Account type
              <select
                value={account.accountType}
                onChange={(event) => void updateType(event.target.value as AccountType)}
                disabled={updating}
              >
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
              </select>
            </label>
            <div className="danger-zone">
              <h3>Close account</h3>
              <p>Accounts with transaction history cannot be deleted.</p>
              <button className="button button--danger" onClick={() => setConfirmDelete(true)} disabled={updating}>
                <Trash2 size={16} />
                Delete account
              </button>
            </div>
          </article>
        )}
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete account?"
        description="This permanently removes the account. The backend prevents deletion when transaction history exists."
        busy={updating}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
