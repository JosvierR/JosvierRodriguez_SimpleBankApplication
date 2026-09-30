import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { auditsApi } from '@/features/audits/api/auditsApi';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type { AuditResponse } from '@/shared/types/api';
import { formatCurrency } from '@/shared/utils/currency';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function AuditsPage() {
  const { t } = useTranslation('banking');
  const [audits, setAudits] = useState<AuditResponse[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setAudits(await auditsApi.list());
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      [...(audits || [])]
        .reverse()
        .filter((audit) =>
          `${audit.action} ${audit.userName} ${audit.actorUsername || ''} ${audit.accountIds.join(' ')}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [audits, query],
  );
  const columns = useMemo<DataColumn<AuditResponse>[]>(
    () => [
      {
        id: 'action',
        header: t('action'),
        sortValue: (row) => row.action,
        mobile: 'primary',
        cell: (row) => <span className="badge badge--action">{t(`transaction.${row.action}`, { defaultValue: row.action })}</span>,
      },
      {
        id: 'customer',
        header: t('bankCustomer'),
        sortValue: (row) => row.userName,
        mobile: 'primary',
        cell: (row) => <strong>{row.userName}</strong>,
      },
      {
        id: 'actor',
        header: t('actor'),
        sortValue: (row) => row.actorUsername || '',
        mobile: 'primary',
        cell: (row) => <strong>{row.actorUsername || t('legacyActor')}</strong>,
      },
      { id: 'accounts', header: t('accountsInvolved'), mobile: 'secondary', cell: (row) => row.accountIds.join(', ') },
      {
        id: 'amount',
        header: t('amount'),
        align: 'end',
        sortValue: (row) => Number(row.amount),
        mobile: 'secondary',
        cell: (row) => formatCurrency(Number(row.amount)),
      },
      {
        id: 'time',
        header: t('timestamp'),
        sortValue: (row) => row.createdAt,
        mobile: 'secondary',
        cell: (row) => formatDateTime(row.createdAt),
      },
    ],
    [t],
  );
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!audits) return <PageLoading />;
  return (
    <>
      <PageHeader title={t('auditLog')} />
      <section className="definition-strip">
        <div>
          <strong>{t('bankCustomer')}</strong>
          <span>{t('bankCustomerHint')}</span>
        </div>
        <div>
          <strong>{t('actor')}</strong>
          <span>{t('actorHint')}</span>
        </div>
      </section>
      <section className="grouped-section">
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">{t('searchAudits')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchAuditsPlaceholder')} />
          </label>
          <span className="result-count">{t('common:records', { count: filtered.length })}</span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          empty={
            <EmptyState
              title={audits.length === 0 ? t('noAudits') : t('noMatchingRecords')}
              message={audits.length === 0 ? t('noAuditsBody') : t('tryAnother')}
            />
          }
        />
      </section>
    </>
  );
}
