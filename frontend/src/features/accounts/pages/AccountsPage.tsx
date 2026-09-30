import { appPath } from '@/app/routes';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { accountsApi } from '@/features/accounts/api/accountsApi';
import { useAuth } from '@/shared/auth/useAuth';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { RowAction, RowActions } from '@/shared/components/RowActions';
import { EmptyState, PageLoading } from '@/shared/components/States';
import type { AccountResponse, AccountType } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function AccountsPage() {
  const { t } = useTranslation('banking');
  const { primaryRole } = useAuth();
  const canOpen = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const canPremium = primaryRole === 'MANAGER' || primaryRole === 'AUDITOR' || primaryRole === 'ADMIN';
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<AccountType | 'ALL'>('ALL');
  const [threshold, setThreshold] = useState('');
  const [premiumActive, setPremiumActive] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      setAccounts(await accountsApi.list());
      setPremiumActive(false);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function premium(event: FormEvent) {
    event.preventDefault();
    const value = Number(threshold);
    if (threshold === '' || value < 0 || !/^\d+(\.\d{1,2})?$/.test(threshold)) {
      setError(t('errors:VALIDATION_ERROR', { ns: 'errors' }));
      return;
    }
    setError('');
    try {
      setAccounts(await accountsApi.premium(value));
      setPremiumActive(true);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }
  const filtered = useMemo(
    () =>
      (accounts || []).filter(
        (account) =>
          (type === 'ALL' || account.accountType === type) &&
          `${account.accountId} ${account.userName}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [accounts, type, query],
  );
  const columns = useMemo<DataColumn<AccountResponse>[]>(
    () => [
      {
        id: 'account',
        header: t('account'),
        sortValue: (row) => row.accountId,
        mobile: 'primary',
        cell: (row) => <span className="mono">•••• {row.accountId.slice(-6)}</span>,
      },
      {
        id: 'customer',
        header: t('customer'),
        sortValue: (row) => row.userName,
        mobile: 'primary',
        cell: (row) => <strong>{row.userName}</strong>,
      },
      {
        id: 'type',
        header: t('type'),
        sortValue: (row) => row.accountType,
        mobile: 'secondary',
        cell: (row) => t(`accountType.${row.accountType}`),
      },
      {
        id: 'balance',
        header: t('balance'),
        align: 'end',
        sortValue: (row) => Number(row.balance),
        mobile: 'primary',
        cell: (row) => formatCurrency(Number(row.balance)),
      },
      {
        id: 'opened',
        header: t('opened'),
        sortValue: (row) => row.createdAt,
        mobile: 'secondary',
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: 'actions',
        header: t('common:actions'),
        mobile: 'primary',
        cell: (row) => (
          <RowActions label={t('actionsForAccount', { id: row.accountId })}>
            <RowAction to={appPath(`/accounts/${row.accountId}`)}>{t('viewAccount')}</RowAction>
            <RowAction to={appPath(`/accounts/${row.accountId}/transactions`)}>{t('transactions')}</RowAction>
          </RowActions>
        ),
      },
    ],
    [t],
  );
  if (!accounts && !error) return <PageLoading />;
  return (
    <>
      <PageHeader
        title={t('accounts')}
        actions={
          canOpen && (
            <Link className="button" to={appPath('/accounts/new')}>
              <Plus size={17} />
              {t('openAccount')}
            </Link>
          )
        }
      />
      {error && (
        <div className="inline-notice inline-notice--error" role="alert">
          {error}
        </div>
      )}
      <section className="grouped-section">
        <div className="toolbar toolbar--wrap">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">{t('searchAccounts')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchAccountsPlaceholder')} />
          </label>
          <label className="compact-field">
            <span className="sr-only">{t('filterType')}</span>
            <select value={type} onChange={(event) => setType(event.target.value as AccountType | 'ALL')}>
              <option value="ALL">{t('allTypes')}</option>
              <option value="CHECKING">{t('accountType.CHECKING')}</option>
              <option value="SAVINGS">{t('accountType.SAVINGS')}</option>
            </select>
          </label>
          {canPremium && (
            <form className="premium-filter" onSubmit={premium}>
              <SlidersHorizontal size={16} />
              <label>
                <span className="sr-only">Premium balance threshold</span>
                <input
                  inputMode="decimal"
                  value={threshold}
                  onChange={(event) => setThreshold(event.target.value)}
                  placeholder="Minimum balance"
                />
              </label>
              <button className="button button--secondary button--small">{t('common:apply')}</button>
              {premiumActive && (
                <button
                  className="link-button"
                  type="button"
                  onClick={() => {
                    setThreshold('');
                    void load();
                  }}
                >
                  {t('common:clear')}
                </button>
              )}
            </form>
          )}
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.accountId}
          empty={<EmptyState title={t('noMatchingRecords')} message={t('tryAnother')} />}
        />
      </section>
    </>
  );
}
