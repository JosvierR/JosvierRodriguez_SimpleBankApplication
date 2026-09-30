import * as Dialog from '@radix-ui/react-dialog'
import { Plus, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { usersApi } from '../api/usersApi'
import { useAuth } from '../auth/useAuth'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { RowAction, RowActionSeparator, RowActions } from '../components/ui/RowActions'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { UserResponse } from '../types/api'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function CustomersPage() {
  const { primaryRole } = useAuth(); const { notify } = useToast()
  const canCreate = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN'
  const canManage = primaryRole === 'MANAGER' || primaryRole === 'ADMIN'
  const [users, setUsers] = useState<UserResponse[] | null>(null); const [error, setError] = useState(''); const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<UserResponse | null>(null); const [deleting, setDeleting] = useState<UserResponse | null>(null); const [busy, setBusy] = useState(false); const [mutationError, setMutationError] = useState('')
  const load = useCallback(async () => { setError(''); try { setUsers(await usersApi.list()) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => (users || []).filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query])
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing) return; setBusy(true); setMutationError(''); const form = new FormData(event.currentTarget); try { const updated = await usersApi.update(editing.id, { name: String(form.get('name')), email: String(form.get('email')) }); setUsers((current) => current?.map((item) => item.id === updated.id ? updated : item) || null); setEditing(null); notify('Customer updated.') } catch (cause) { setMutationError(getErrorMessage(cause)) } finally { setBusy(false) } }
  async function remove() { if (!deleting) return; setBusy(true); setMutationError(''); try { await usersApi.delete(deleting.id); setUsers((current) => current?.filter((item) => item.id !== deleting.id) || null); setDeleting(null); notify('Customer deleted.') } catch (cause) { const message = cause instanceof ApiError && cause.status === 409 ? 'This customer cannot be deleted while accounts still exist.' : getErrorMessage(cause); setMutationError(message); setDeleting(null); notify(message, 'error') } finally { setBusy(false) } }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!users) return <PageLoading />
  return <><PageHeader title="Customers" actions={canCreate && <Link className="button" to="/accounts/new"><Plus size={17} />Open account</Link>} />{mutationError && <div className="inline-notice inline-notice--error" role="alert">{mutationError}</div>}<section className="grouped-section"><div className="toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search customers</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" /></label><span className="result-count">{filtered.length} customer{filtered.length === 1 ? '' : 's'}</span></div>{users.length === 0 ? <EmptyState title="No customers" message="No customer profiles are available." action={canCreate && <Link className="button" to="/accounts/new">Open account</Link>} /> : filtered.length === 0 ? <EmptyState title="No matching customers" message="Try a different name or email." /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Created</th><th className="actions-cell"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small className="mobile-meta">{user.id}</small></td><td>{user.email}</td><td>{formatDateTime(user.createdAt)}</td><td className="actions-cell"><RowActions label={`Actions for ${user.name}`}><RowAction to={`/customers/${user.id}`}>View details</RowAction>{canCreate && <RowAction to={`/accounts/new?userId=${user.id}`}>Open account</RowAction>}{canManage && <><RowAction onSelect={() => { setEditing(user); setMutationError('') }}>Edit customer</RowAction><RowActionSeparator /><RowAction destructive onSelect={() => setDeleting(user)}>Delete customer</RowAction></>}</RowActions></td></tr>)}</tbody></table></div>}</section><Dialog.Root open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null) }}><Dialog.Portal><Dialog.Overlay className="dialog-backdrop" /><Dialog.Content className="dialog"><Dialog.Title>Edit customer</Dialog.Title><Dialog.Description className="text-secondary">Update the customer name and contact email.</Dialog.Description><Dialog.Close asChild><button className="icon-button dialog__close" aria-label="Close"><X size={18} /></button></Dialog.Close>{editing && <form onSubmit={save}>{mutationError && <div className="form-error" role="alert">{mutationError}</div>}<label>Name<input name="name" defaultValue={editing.name} required autoFocus /></label><label>Email<input name="email" type="email" defaultValue={editing.email} required /></label><div className="dialog__actions"><Dialog.Close asChild><button type="button" className="button button--secondary">Cancel</button></Dialog.Close><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form>}</Dialog.Content></Dialog.Portal></Dialog.Root><ConfirmDialog open={Boolean(deleting)} title="Delete customer?" description={`${deleting?.name || 'This customer'} will be permanently removed. Customers with accounts cannot be deleted.`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} /></>
}
