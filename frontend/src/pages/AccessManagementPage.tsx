import * as Dialog from '@radix-ui/react-dialog'
import * as Tabs from '@radix-ui/react-tabs'
import { Search, Settings2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { adminApi } from '../api/adminApi'
import { usersApi } from '../api/usersApi'
import { PageHeader } from '../components/ui/PageHeader'
import { RowAction, RowActions } from '../components/ui/RowActions'
import { SelectField } from '../components/ui/SelectField'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { AdminAuthUserResponse, Role, UserResponse } from '../types/api'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

const roleOptions = [
  { value: 'CUSTOMER', label: 'Customer' }, { value: 'TELLER', label: 'Teller' },
  { value: 'MANAGER', label: 'Manager' }, { value: 'AUDITOR', label: 'Auditor' },
  { value: 'ADMIN', label: 'Administrator' },
]

const roleLabels: Record<Role, string> = { CUSTOMER: 'Customer', TELLER: 'Teller', MANAGER: 'Manager', AUDITOR: 'Auditor', ADMIN: 'Administrator' }

export function AccessManagementPage() {
  const { notify } = useToast()
  const [identities, setIdentities] = useState<AdminAuthUserResponse[] | null>(null)
  const [customers, setCustomers] = useState<UserResponse[]>([])
  const [selected, setSelected] = useState<AdminAuthUserResponse | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = useCallback(async () => { setError(''); try { const [authUsers, bankCustomers] = await Promise.all([adminApi.users(), usersApi.list()]); setIdentities(authUsers); setCustomers(bankCustomers) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => (identities || []).filter((identity) => `${identity.username} ${identity.email} ${identity.role} ${identity.bankUserName || ''}`.toLowerCase().includes(query.toLowerCase())), [identities, query])
  function replace(updated: AdminAuthUserResponse) { setIdentities((current) => current?.map((item) => item.id === updated.id ? updated : item) || null); setSelected(updated) }
  async function changeRole(role: Role) { if (!selected) return; setBusy(true); setError(''); try { replace(await adminApi.changeRole(selected.id, role)); notify('Role updated.') } catch (cause) { const message = getErrorMessage(cause); setError(message); notify(message, 'error') } finally { setBusy(false) } }
  async function changeEnabled() { if (!selected) return; setBusy(true); setError(''); try { replace(await adminApi.changeEnabled(selected.id, !selected.enabled)); notify(selected.enabled ? 'Identity disabled.' : 'Identity enabled.') } catch (cause) { const message = getErrorMessage(cause); setError(message); notify(message, 'error') } finally { setBusy(false) } }
  async function changeLink(bankUserId: string) { if (!selected) return; setBusy(true); setError(''); try { replace(bankUserId === 'UNLINKED' ? await adminApi.unlinkCustomer(selected.id) : await adminApi.linkCustomer(selected.id, bankUserId)); notify(bankUserId === 'UNLINKED' ? 'Customer link removed.' : 'Customer linked.') } catch (cause) { const message = getErrorMessage(cause); setError(message); notify(message, 'error') } finally { setBusy(false) } }
  if (error && !identities) return <ErrorState message={error} onRetry={() => void load()} />
  if (!identities) return <PageLoading />
  return <><PageHeader title="Access management" />{error && <div className="inline-notice inline-notice--error" role="alert">{error}</div>}<section className="grouped-section"><div className="toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search access identities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username, email, or role" /></label><span className="result-count">{filtered.length} identities</span></div>{filtered.length === 0 ? <EmptyState title="No identities found" message="Try a different search term." /> : <div className="table-wrap"><table><thead><tr><th>Username</th><th>Email</th><th>Role</th><th>Linked customer</th><th>Status</th><th>Created</th><th className="actions-cell"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((identity) => <tr key={identity.id}><td><strong>{identity.username}</strong></td><td>{identity.email}</td><td>{roleLabels[identity.role]}</td><td>{identity.bankUserName || 'Not linked'}</td><td><span className={`status-label ${identity.enabled ? 'status-label--active' : 'status-label--disabled'}`}>{identity.enabled ? 'Enabled' : 'Disabled'}</span></td><td>{formatDateTime(identity.createdAt)}</td><td className="actions-cell"><RowActions label={`Manage ${identity.username}`}><RowAction onSelect={() => setSelected(identity)}>Manage access</RowAction></RowActions></td></tr>)}</tbody></table></div>}</section><Dialog.Root open={Boolean(selected)} onOpenChange={(open) => { if (!open) { setSelected(null); setError('') } }}><Dialog.Portal><Dialog.Overlay className="sheet-overlay" /><Dialog.Content className="access-sheet"><Dialog.Title>Manage access</Dialog.Title><Dialog.Description>{selected?.username} · {selected?.email}</Dialog.Description><Dialog.Close asChild><button className="icon-button access-sheet__close" aria-label="Close access management"><X size={19} /></button></Dialog.Close>{selected && <Tabs.Root defaultValue="role" className="access-tabs"><Tabs.List aria-label="Access settings"><Tabs.Trigger value="role">Role</Tabs.Trigger><Tabs.Trigger value="customer">Customer link</Tabs.Trigger><Tabs.Trigger value="status">Status</Tabs.Trigger></Tabs.List><Tabs.Content value="role"><label>Primary role<SelectField label="Primary role" value={selected.role} options={roleOptions} onChange={(value) => void changeRole(value as Role)} /></label><p className="field-help">One role per login. A staff role removes a customer link.</p></Tabs.Content><Tabs.Content value="customer">{selected.role !== 'CUSTOMER' ? <div className="inline-notice">Customer links are available only for the Customer role.</div> : <label>Linked bank customer<SelectField label="Linked bank customer" value={selected.bankUserId || 'UNLINKED'} options={[{ value: 'UNLINKED', label: 'Not linked' }, ...customers.map((customer) => ({ value: customer.id, label: `${customer.name} · ${customer.email}` }))]} onChange={(value) => void changeLink(value)} /></label>}</Tabs.Content><Tabs.Content value="status"><div className="access-status"><span className={`status-label ${selected.enabled ? 'status-label--active' : 'status-label--disabled'}`}>{selected.enabled ? 'Enabled' : 'Disabled'}</span><p>A disabled login cannot sign in, and an existing token stops working.</p><button className={`button ${selected.enabled ? 'button--danger' : ''}`} onClick={() => void changeEnabled()} disabled={busy}>{selected.enabled ? 'Disable identity' : 'Enable identity'}</button></div></Tabs.Content></Tabs.Root>}<div className="access-sheet__footer"><Settings2 size={16} /><span>Changes are recorded in the security audit.</span></div></Dialog.Content></Dialog.Portal></Dialog.Root></>
}
