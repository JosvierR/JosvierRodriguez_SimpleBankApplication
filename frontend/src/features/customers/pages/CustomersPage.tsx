import { appPath } from '@/app/routes';
import * as Dialog from '@radix-ui/react-dialog';
import { Plus, Search, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { usersApi } from '@/features/customers/api/usersApi';
import { useAuth } from '@/shared/auth/useAuth';
import { ConfirmDialog } from '@/shared/components/ConfirmDialog';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { RowAction, RowActionSeparator, RowActions } from '@/shared/components/RowActions';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import { ApiError } from '@/shared/api/client';
import type { UserResponse } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

export function CustomersPage() {
  const { t } = useTranslation('banking');
  const { primaryRole } = useAuth();
  const { notify } = useToast();
  const canCreate = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const canManage = primaryRole === 'MANAGER' || primaryRole === 'ADMIN';
  const [users, setUsers] = useState<UserResponse[] | null>(null);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get('query') || '');
  const [editing, setEditing] = useState<UserResponse | null>(null);
  const [deleting, setDeleting] = useState<UserResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [mutationError, setMutationError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setUsers(await usersApi.list());
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () => (users || []).filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())),
    [users, query],
  );
  const columns = useMemo<DataColumn<UserResponse>[]>(
    () => [
      { id: 'name', header: t('name'), sortValue: (row) => row.name, mobile: 'primary', cell: (row) => <strong>{row.name}</strong> },
      { id: 'email', header: t('email'), sortValue: (row) => row.email, mobile: 'primary', cell: (row) => row.email },
      {
        id: 'created',
        header: t('created'),
        sortValue: (row) => row.createdAt,
        mobile: 'secondary',
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: 'actions',
        header: t('common:actions'),
        mobile: 'primary',
        cell: (row) => (
          <RowActions label={t('actionsFor', { name: row.name })}>
            <RowAction to={appPath(`/customers/${row.id}`)}>{t('viewDetails')}</RowAction>
            {canCreate && <RowAction to={appPath(`/accounts/new?userId=${row.id}`)}>{t('openAccount')}</RowAction>}
            {canManage && (
              <>
                <RowAction
                  onSelect={() => {
                    setEditing(row);
                    setMutationError('');
                  }}
                >
                  {t('editCustomer')}
                </RowAction>
                <RowActionSeparator />
                <RowAction destructive onSelect={() => setDeleting(row)}>
                  {t('deleteCustomer')}
                </RowAction>
              </>
            )}
          </RowActions>
        ),
      },
    ],
    [canCreate, canManage, t],
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setMutationError('');
    const form = new FormData(event.currentTarget);
    try {
      const updated = await usersApi.update(editing.id, { name: String(form.get('name')), email: String(form.get('email')) });
      setUsers((current) => current?.map((item) => (item.id === updated.id ? updated : item)) || null);
      setEditing(null);
      notify(t('customerUpdated'));
    } catch (cause) {
      setMutationError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setMutationError('');
    try {
      await usersApi.delete(deleting.id);
      setUsers((current) => current?.filter((item) => item.id !== deleting.id) || null);
      setDeleting(null);
      notify(t('customerDeleted'));
    } catch (cause) {
      const message = cause instanceof ApiError && cause.status === 409 ? t('customerConflict') : getErrorMessage(cause);
      setMutationError(message);
      setDeleting(null);
      notify(message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!users) return <PageLoading />;
  return (
    <>
      <PageHeader
        title={t('customers')}
        actions={
          canCreate && (
            <Link className="button" to={appPath('/accounts/new')}>
              <Plus size={17} />
              {t('openAccount')}
            </Link>
          )
        }
      />
      {mutationError && (
        <div className="inline-notice inline-notice--error" role="alert">
          {mutationError}
        </div>
      )}
      <section className="grouped-section">
        <div className="toolbar">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">{t('searchCustomers')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} />
          </label>
          <span className="result-count">{t('common:customers', { count: filtered.length })}</span>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          empty={
            users.length === 0 ? (
              <EmptyState
                title={t('noCustomers')}
                message={t('noCustomersBody')}
                action={
                  canCreate && (
                    <Link className="button" to={appPath('/accounts/new')}>
                      {t('openAccount')}
                    </Link>
                  )
                }
              />
            ) : (
              <EmptyState title={t('noMatchCustomers')} message={t('noMatchBody')} />
            )
          }
        />
      </section>
      <Dialog.Root
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-backdrop" />
          <Dialog.Content className="dialog">
            <Dialog.Title>{t('editTitle')}</Dialog.Title>
            <Dialog.Description className="text-secondary">{t('editBody')}</Dialog.Description>
            <Dialog.Close asChild>
              <button className="icon-button dialog__close" aria-label={t('common:close')}>
                <X size={18} />
              </button>
            </Dialog.Close>
            {editing && (
              <form onSubmit={save}>
                {mutationError && (
                  <div className="form-error" role="alert">
                    {mutationError}
                  </div>
                )}
                <label>
                  {t('name')}
                  <input name="name" defaultValue={editing.name} required autoFocus />
                </label>
                <label>
                  {t('email')}
                  <input name="email" type="email" defaultValue={editing.email} required />
                </label>
                <div className="dialog__actions">
                  <Dialog.Close asChild>
                    <button type="button" className="button button--secondary">
                      {t('common:cancel')}
                    </button>
                  </Dialog.Close>
                  <button className="button" disabled={busy}>
                    {busy ? t('common:working') : t('common:save')}
                  </button>
                </div>
              </form>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('deleteTitle')}
        description={t('deleteBody', { name: deleting?.name || t('customer') })}
        busy={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void remove()}
      />
    </>
  );
}
