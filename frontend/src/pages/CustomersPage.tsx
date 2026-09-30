import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Edit3, Eye, Plus, Search, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError } from '../api/client'
import { usersApi } from '../api/usersApi'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { UserResponse } from '../types/api'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function CustomersPage() {
  const { notify } = useToast()
  const [users, setUsers] = useState<UserResponse[] | null>(null); const [error, setError] = useState(''); const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<UserResponse | null>(null); const [deleting, setDeleting] = useState<UserResponse | null>(null); const [busy, setBusy] = useState(false); const [mutationError, setMutationError] = useState('')
  const load = useCallback(async () => { setError(''); try { setUsers(await usersApi.list()) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => (users || []).filter((user) => `${user.name} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setMutationError('')
    const form = new FormData(event.currentTarget)
    try { const updated = await usersApi.update(editing.id, { name: String(form.get('name')), email: String(form.get('email')) }); setUsers((current) => current?.map((item) => item.id === updated.id ? updated : item) || null); setEditing(null); notify('Customer updated.') }
    catch (cause) { setMutationError(getErrorMessage(cause)) } finally { setBusy(false) }
  }
  async function remove() {
    if (!deleting) return; setBusy(true); setMutationError('')
    try { await usersApi.delete(deleting.id); setUsers((current) => current?.filter((item) => item.id !== deleting.id) || null); setDeleting(null); notify('Customer deleted.') }
    catch (cause) { setMutationError(cause instanceof ApiError && cause.status === 409 ? 'This customer cannot be deleted while accounts still exist.' : getErrorMessage(cause)); setDeleting(null); notify(cause instanceof ApiError && cause.status === 409 ? 'This customer cannot be deleted while accounts still exist.' : getErrorMessage(cause), 'error') }
    finally { setBusy(false) }
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!users) return <PageLoading />
  return <><PageHeader eyebrow="Customer directory" title="Customers" description="Search, review, and maintain every customer profile." actions={<Link className="button" to="/accounts/new"><Plus size={17} />Open account</Link>} />{mutationError && <div className="inline-notice inline-notice--error" role="alert">{mutationError}</div>}<section className="panel"><div className="toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search customers</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or email" /></label><span className="result-count">{filtered.length} customer{filtered.length === 1 ? '' : 's'}</span></div>{users.length === 0 ? <EmptyState title="No customers yet" message="Open an account to create your first customer." action={<Link className="button" to="/accounts/new">Open account</Link>} /> : filtered.length === 0 ? <EmptyState title="No matching customers" message="Try a different name or email." /> : <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Created</th><th className="actions-cell">Actions</th></tr></thead><tbody>{filtered.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small className="mobile-meta">{user.id}</small></td><td>{user.email}</td><td>{formatDateTime(user.createdAt)}</td><td className="actions-cell"><Link className="icon-button" to={`/customers/${user.id}`} aria-label={`View ${user.name}`} title="View"><Eye size={17} /></Link><button className="icon-button" onClick={() => { setEditing(user); setMutationError('') }} aria-label={`Edit ${user.name}`} title="Edit"><Edit3 size={17} /></button><button className="icon-button icon-button--danger" onClick={() => setDeleting(user)} aria-label={`Delete ${user.name}`} title="Delete"><Trash2 size={17} /></button></td></tr>)}</tbody></table></div>}</section>{editing && <div className="dialog-backdrop"><form className="dialog" role="dialog" aria-modal="true" aria-labelledby="edit-customer-title" onSubmit={save}><button className="icon-button dialog__close" type="button" onClick={() => setEditing(null)} aria-label="Close"><X size={18} /></button><h2 id="edit-customer-title">Edit customer</h2><p className="text-secondary">Update the customer name and contact email.</p>{mutationError && <div className="form-error" role="alert">{mutationError}</div>}<label>Name<input name="name" defaultValue={editing.name} required autoFocus /></label><label>Email<input name="email" type="email" defaultValue={editing.email} required /></label><div className="dialog__actions"><button type="button" className="button button--secondary" onClick={() => setEditing(null)}>Cancel</button><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div></form></div>}<ConfirmDialog open={Boolean(deleting)} title="Delete customer?" description={`${deleting?.name || 'This customer'} will be permanently removed. Customers with accounts cannot be deleted.`} busy={busy} onCancel={() => setDeleting(null)} onConfirm={() => void remove()} /></>
}
