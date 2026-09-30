import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { Search, Settings2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminApi } from '@/features/access-management/api/adminApi';
import { usersApi } from '@/features/customers/api/usersApi';
import { DataTable, type DataColumn } from '@/shared/components/DataTable';
import { PageHeader } from '@/shared/components/PageHeader';
import { RowAction, RowActions } from '@/shared/components/RowActions';
import { SelectField } from '@/shared/components/SelectField';
import { EmptyState, ErrorState, PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { AdminAuthUserResponse, Role, UserResponse } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';

const roles: Role[] = ['CUSTOMER', 'TELLER', 'MANAGER', 'AUDITOR', 'ADMIN'];

export function AccessManagementPage() {
  const { t } = useTranslation();
  const { notify } = useToast();
  const [identities, setIdentities] = useState<AdminAuthUserResponse[] | null>(null);
  const [customers, setCustomers] = useState<UserResponse[]>([]);
  const [selected, setSelected] = useState<AdminAuthUserResponse | null>(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [enabledFilter, setEnabledFilter] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setError('');
    try {
      const [authUsers, bankCustomers] = await Promise.all([adminApi.users(), usersApi.list()]);
      setIdentities(authUsers);
      setCustomers(bankCustomers);
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const filtered = useMemo(
    () =>
      (identities || []).filter((identity) => {
        const matchesQuery = `${identity.username} ${identity.email} ${identity.role} ${identity.bankUserName || ''}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesRole = roleFilter === 'ALL' || identity.role === roleFilter;
        const matchesEnabled = enabledFilter === 'ALL' || (enabledFilter === 'ENABLED' ? identity.enabled : !identity.enabled);
        return matchesQuery && matchesRole && matchesEnabled;
      }),
    [identities, query, roleFilter, enabledFilter],
  );
  const columns = useMemo<DataColumn<AdminAuthUserResponse>[]>(
    () => [
      {
        id: 'username',
        header: t('admin:username'),
        sortValue: (row) => row.username,
        mobile: 'primary',
        cell: (row) => <strong>{row.username}</strong>,
      },
      { id: 'email', header: t('banking:email'), sortValue: (row) => row.email, mobile: 'secondary', cell: (row) => row.email },
      { id: 'role', header: t('admin:role'), sortValue: (row) => row.role, mobile: 'primary', cell: (row) => t(`roles.${row.role}`) },
      { id: 'customer', header: t('admin:linkedCustomer'), mobile: 'secondary', cell: (row) => row.bankUserName || t('admin:noLinked') },
      {
        id: 'status',
        header: t('admin:status'),
        sortValue: (row) => (row.enabled ? 1 : 0),
        mobile: 'primary',
        cell: (row) => (
          <span className={`status-label ${row.enabled ? 'status-label--active' : 'status-label--disabled'}`}>
            {row.enabled ? t('admin:enabled') : t('admin:disabled')}
          </span>
        ),
      },
      {
        id: 'created',
        header: t('banking:created'),
        sortValue: (row) => row.createdAt,
        mobile: 'secondary',
        cell: (row) => formatDateTime(row.createdAt),
      },
      {
        id: 'actions',
        header: t('actions'),
        mobile: 'primary',
        cell: (row) => (
          <RowActions label={`${t('admin:title')} ${row.username}`}>
            <RowAction onSelect={() => setSelected(row)}>{t('admin:title')}</RowAction>
          </RowActions>
        ),
      },
    ],
    [t],
  );

  function replace(updated: AdminAuthUserResponse) {
    setIdentities((current) => current?.map((item) => (item.id === updated.id ? updated : item)) || null);
    setSelected(updated);
  }
  async function changeRole(role: Role) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      replace(await adminApi.changeRole(selected.id, role));
      notify(t('admin:role'));
    } catch (cause) {
      const message = getErrorMessage(cause);
      setError(message);
      notify(message, 'error');
    } finally {
      setBusy(false);
    }
  }
  async function changeEnabled() {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      replace(await adminApi.changeEnabled(selected.id, !selected.enabled));
    } catch (cause) {
      const message = getErrorMessage(cause);
      setError(message);
      notify(message, 'error');
    } finally {
      setBusy(false);
    }
  }
  async function changeLink(bankUserId: string) {
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      replace(
        bankUserId === 'UNLINKED' ? await adminApi.unlinkCustomer(selected.id) : await adminApi.linkCustomer(selected.id, bankUserId),
      );
    } catch (cause) {
      const message = getErrorMessage(cause);
      setError(message);
      notify(message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (error && !identities) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!identities) return <PageLoading />;
  return (
    <>
      <PageHeader title={t('admin:title')} />
      {error && (
        <div className="inline-notice inline-notice--error" role="alert">
          {error}
        </div>
      )}
      <section className="grouped-section">
        <div className="toolbar toolbar--wrap">
          <label className="search-field">
            <Search size={17} />
            <span className="sr-only">{t('admin:search')}</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('admin:search')} />
          </label>
          <label className="compact-field">
            <span className="sr-only">{t('admin:role')}</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as Role | 'ALL')}>
              <option value="ALL">{t('admin:allRoles')}</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="compact-field">
            <span className="sr-only">{t('admin:status')}</span>
            <select value={enabledFilter} onChange={(event) => setEnabledFilter(event.target.value as 'ALL' | 'ENABLED' | 'DISABLED')}>
              <option value="ALL">{t('admin:allStatuses')}</option>
              <option value="ENABLED">{t('admin:enabled')}</option>
              <option value="DISABLED">{t('admin:disabled')}</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={columns}
          data={filtered}
          getRowId={(row) => row.id}
          pageSize={20}
          empty={<EmptyState title={t('banking:noMatchingRecords')} message={t('banking:tryAnother')} />}
        />
      </section>
      <Dialog.Root
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setError('');
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="sheet-overlay" />
          <Dialog.Content className="access-sheet">
            <Dialog.Title>{t('admin:title')}</Dialog.Title>
            <Dialog.Description>
              {selected?.username} · {selected?.email}
            </Dialog.Description>
            <Dialog.Close asChild>
              <button className="icon-button access-sheet__close" aria-label={t('close')}>
                <X size={19} />
              </button>
            </Dialog.Close>
            {selected && (
              <Tabs.Root defaultValue="role" className="access-tabs">
                <Tabs.List aria-label={t('admin:title')}>
                  <Tabs.Trigger value="role">{t('admin:role')}</Tabs.Trigger>
                  <Tabs.Trigger value="customer">{t('admin:linkedCustomer')}</Tabs.Trigger>
                  <Tabs.Trigger value="status">{t('admin:status')}</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="role">
                  <SelectField
                    label={t('admin:role')}
                    value={selected.role}
                    options={roles.map((role) => ({ value: role, label: t(`roles.${role}`) }))}
                    onChange={(value) => void changeRole(value as Role)}
                  />
                </Tabs.Content>
                <Tabs.Content value="customer">
                  {selected.role !== 'CUSTOMER' ? (
                    <div className="inline-notice">{t('admin:noLinked')}</div>
                  ) : (
                    <SelectField
                      label={t('admin:linkedCustomer')}
                      value={selected.bankUserId || 'UNLINKED'}
                      options={[
                        { value: 'UNLINKED', label: t('admin:noLinked') },
                        ...customers.map((customer) => ({ value: customer.id, label: `${customer.name} · ${customer.email}` })),
                      ]}
                      onChange={(value) => void changeLink(value)}
                    />
                  )}
                </Tabs.Content>
                <Tabs.Content value="status">
                  <div className="access-status">
                    <span className={`status-label ${selected.enabled ? 'status-label--active' : 'status-label--disabled'}`}>
                      {selected.enabled ? t('admin:enabled') : t('admin:disabled')}
                    </span>
                    <button
                      className={`button ${selected.enabled ? 'button--danger' : ''}`}
                      onClick={() => void changeEnabled()}
                      disabled={busy}
                    >
                      {selected.enabled ? t('admin:disabled') : t('admin:enabled')}
                    </button>
                  </div>
                </Tabs.Content>
              </Tabs.Root>
            )}
            <div className="access-sheet__footer">
              <Settings2 size={16} />
              <span>{t('nav.securityAudit')}</span>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
