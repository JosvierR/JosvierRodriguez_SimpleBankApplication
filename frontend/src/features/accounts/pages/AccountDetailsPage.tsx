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
import { useTranslation } from 'react-i18next';

export function AccountDetailsPage() {
  const { t } = useTranslation('banking');
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
      notify(t('accountTypeUpdated'));
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
      notify(t('accountDeleted'));
      navigate(appPath('/accounts'));
    } catch (cause) {
      const message = cause instanceof ApiError && cause.status === 409 ? t('historyDeleteNote') : getErrorMessage(cause);
      setError(message);
      notify(message, 'error');
      setConfirmDelete(false);
    } finally {
      setUpdating(false);
    }
  }
  if (error && !account) return <ErrorState title={t('accountUnavailable')} message={error} onRetry={() => void load()} />;
  if (!account) return <PageLoading />;
  return (
    <>
      <Link className="back-link" to={appPath('/accounts')}>
        <ArrowLeft size={16} />
        {t('accounts')}
      </Link>
      <PageHeader title={account.userName} description={t('accountEnding', { id: account.accountId.slice(-6) })} />
      <section className="balance-hero">
        <div>
          <span>{t('availableBalance')}</span>
          <strong>{formatCurrency(Number(account.balance))}</strong>
        </div>
        <div className="balance-actions">
          {canCash && (
            <>
              <Link className="button" to={appPath(`/accounts/${accountId}/deposit`)}>
                <ArrowDownToLine size={17} />
                {t('depositTitle')}
              </Link>
              <Link className="button button--secondary" to={appPath(`/accounts/${accountId}/withdraw`)}>
                <ArrowUpFromLine size={17} />
                {t('withdrawTitle')}
              </Link>
            </>
          )}
          {canManage && (
            <Link className="button button--secondary" to={appPath(`/transfer?from=${accountId}`)}>
              <ArrowLeftRight size={17} />
              {t('common:nav.transfer')}
            </Link>
          )}
          <Link className="button button--secondary" to={appPath(`/accounts/${accountId}/transactions`)}>
            <History size={17} />
            {t('transactions')}
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
          <h2>{t('accountInformation')}</h2>
          <dl className="details-list">
            <div>
              <dt>{t('accountId')}</dt>
              <dd className="mono">{account.accountId}</dd>
            </div>
            <div>
              <dt>{t('customer')}</dt>
              <dd>
                <Link to={appPath(`/customers/${account.userId}`)}>{account.userName}</Link>
              </dd>
            </div>
            <div>
              <dt>{t('accountTypeLegend')}</dt>
              <dd>{t(`accountType.${account.accountType}`)}</dd>
            </div>
            <div>
              <dt>{t('opened')}</dt>
              <dd>{formatDateTime(account.createdAt)}</dd>
            </div>
          </dl>
        </article>
        {canManage && (
          <article className="grouped-section">
            <h2>{t('accountSettings')}</h2>
            <label>
              {t('accountTypeLegend')}
              <select
                value={account.accountType}
                onChange={(event) => void updateType(event.target.value as AccountType)}
                disabled={updating}
              >
                <option value="CHECKING">{t('accountType.CHECKING')}</option>
                <option value="SAVINGS">{t('accountType.SAVINGS')}</option>
              </select>
            </label>
            <div className="danger-zone">
              <h3>{t('closeAccount')}</h3>
              <p>{t('historyDeleteNote')}</p>
              <button className="button button--danger" onClick={() => setConfirmDelete(true)} disabled={updating}>
                <Trash2 size={16} />
                {t('deleteAccountAction')}
              </button>
            </div>
          </article>
        )}
      </section>
      <ConfirmDialog
        open={confirmDelete}
        title={t('deleteAccountTitle')}
        description={t('deleteAccountBody')}
        busy={updating}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
