import { useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowLeftRight, ArrowUpFromLine, History, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { ApiError } from '../api/client'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { AccountResponse, AccountType } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function AccountDetailsPage() {
  const { accountId = '' } = useParams(); const navigate = useNavigate(); const { notify } = useToast()
  const [account, setAccount] = useState<AccountResponse | null>(null); const [error, setError] = useState(''); const [updating, setUpdating] = useState(false); const [confirmDelete, setConfirmDelete] = useState(false)
  const load = useCallback(async () => { setError(''); try { setAccount(await accountsApi.get(accountId)) } catch (cause) { setError(getErrorMessage(cause)) } }, [accountId])
  useEffect(() => { void load() }, [load])
  async function updateType(value: AccountType) { if (!account || value === account.accountType) return; setUpdating(true); setError(''); try { setAccount(await accountsApi.update(accountId, { accountType: value })); notify('Account type updated.') } catch (cause) { setError(getErrorMessage(cause)) } finally { setUpdating(false) } }
  async function remove() { setUpdating(true); try { await accountsApi.delete(accountId); notify('Account deleted.'); navigate('/accounts') } catch (cause) { const message = cause instanceof ApiError && cause.status === 409 ? 'Accounts with transaction history cannot be deleted.' : getErrorMessage(cause); setError(message); notify(message, 'error'); setConfirmDelete(false) } finally { setUpdating(false) } }
  if (error && !account) return <ErrorState title="Account unavailable" message={error} onRetry={() => void load()} />
  if (!account) return <PageLoading />
  return <><Link className="back-link" to="/accounts"><ArrowLeft size={16} />Accounts</Link><PageHeader eyebrow="Account details" title={account.userName} description={`Account ${account.accountId}`} /><section className="balance-hero"><div><span>Available balance</span><strong>{formatCurrency(Number(account.balance))}</strong><small>Current backend balance</small></div><div className="balance-actions"><Link className="button" to={`/accounts/${accountId}/deposit`}><ArrowDownToLine size={17} />Deposit</Link><Link className="button button--secondary" to={`/accounts/${accountId}/withdraw`}><ArrowUpFromLine size={17} />Withdraw</Link><Link className="button button--secondary" to={`/transfer?from=${accountId}`}><ArrowLeftRight size={17} />Transfer</Link><Link className="button button--secondary" to={`/accounts/${accountId}/transactions`}><History size={17} />Transactions</Link></div></section>{error && <div className="inline-notice inline-notice--error" role="alert">{error}</div>}<section className="details-grid"><article className="panel"><h2>Account information</h2><dl className="details-list"><div><dt>Account ID</dt><dd className="mono">{account.accountId}</dd></div><div><dt>Customer</dt><dd><Link to={`/customers/${account.userId}`}>{account.userName}</Link></dd></div><div><dt>Account type</dt><dd><span className="badge">{account.accountType}</span></dd></div><div><dt>Opened</dt><dd>{formatDateTime(account.createdAt)}</dd></div></dl></article><article className="panel"><h2>Account settings</h2><p className="text-secondary">Only the account type can be changed. Ownership, balance, and account identity remain protected.</p><label>Account type<select value={account.accountType} onChange={(e) => void updateType(e.target.value as AccountType)} disabled={updating}><option value="CHECKING">Checking</option><option value="SAVINGS">Savings</option></select></label><hr /><button className="button button--danger button--small" onClick={() => setConfirmDelete(true)} disabled={updating}><Trash2 size={16} />Delete account</button><p className="field-help">Accounts with transaction history cannot be deleted.</p></article></section><ConfirmDialog open={confirmDelete} title="Delete account?" description="This permanently removes the account. The backend will prevent deletion if transaction history exists." busy={updating} onCancel={() => setConfirmDelete(false)} onConfirm={() => void remove()} /></>
}
