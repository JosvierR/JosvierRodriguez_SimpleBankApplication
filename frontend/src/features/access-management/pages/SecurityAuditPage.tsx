import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { adminApi } from '@/features/access-management/api/adminApi';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import type { SecurityAuditResponse } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function SecurityAuditPage() {
  const { t } = useTranslation();
  const [audits, setAudits] = useState<SecurityAuditResponse[] | null>(null);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setAudits(await adminApi.securityAudits());
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      (audits || []).filter((audit) =>
        `${audit.action} ${audit.actorUsername} ${audit.targetAuthUserId}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [audits, query],
  );
  const columns = useMemo<DataColumn<SecurityAuditResponse>[]>(
    () => [
      {
        id: 'action',
        header: t('banking:action'),
        sortValue: (row) => row.action,
        mobile: 'primary',
        cell: (row) => row.action.replaceAll('_', ' '),
      },
      {
        id: 'actor',
        header: t('banking:actor'),
        sortValue: (row) => row.actorUsername,
        mobile: 'primary',
        cell: (row) => row.actorUsername,
      },
      { id: 'target', header: t('admin:username'), mobile: 'secondary', cell: (row) => row.targetAuthUserId },
      { id: 'previous', header: t('banking:created'), mobile: 'hidden', cell: (row) => row.previousValue || '—' },
      { id: 'next', header: t('admin:status'), mobile: 'secondary', cell: (row) => row.newValue || '—' },
      {
        id: 'time',
        header: t('banking:timestamp'),
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
      <PageHeader title={t('admin:securityTitle')} />
      <section className="grouped-section">
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">{t('admin:search')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('admin:search')} />
          </label>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          empty={<EmptyState title={t('banking:noAudits')} message={t('banking:noAuditsBody')} />}
        />
      </section>
    </>
  );
}
