import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { usersApi } from '../api/usersApi'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import type { AccountResponse, UserResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function CustomerDetailsPage() {
  const { userId = '' } = useParams(); const [data, setData] = useState<{ user: UserResponse; accounts: AccountResponse[] } | null>(null); const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { const [user, accounts] = await Promise.all([usersApi.get(userId), usersApi.accounts(userId)]); setData({ user, accounts }) } catch (cause) { setError(getErrorMessage(cause)) } }, [userId])
  useEffect(() => { void load() }, [load])
  if (error) return <ErrorState title="Customer unavailable" message={error} onRetry={() => void load()} />
  if (!data) return <PageLoading />
  return <><Link className="back-link" to="/customers"><ArrowLeft size={16} />Customers</Link><PageHeader eyebrow="Customer profile" title={data.user.name} description={data.user.email} actions={<Link className="button" to={`/accounts/new?userId=${data.user.id}`}><Plus size={17} />Open another account</Link>} /><section className="details-grid"><article className="panel"><h2>Customer details</h2><dl className="details-list"><div><dt>Customer ID</dt><dd className="mono">{data.user.id}</dd></div><div><dt>Name</dt><dd>{data.user.name}</dd></div><div><dt>Email</dt><dd>{data.user.email}</dd></div><div><dt>Created</dt><dd>{formatDateTime(data.user.createdAt)}</dd></div></dl></article><article className="panel panel--wide"><div className="section-heading"><div><h2>Accounts</h2><p>{data.accounts.length} account{data.accounts.length === 1 ? '' : 's'} owned by this customer.</p></div></div>{data.accounts.length === 0 ? <EmptyState title="No accounts" message="This customer does not have an account yet." action={<Link className="button" to={`/accounts/new?userId=${data.user.id}`}>Open account</Link>} /> : <div className="account-card-list">{data.accounts.map((account) => <Link to={`/accounts/${account.accountId}`} className="account-card-row" key={account.accountId}><div><span className="badge">{account.accountType}</span><strong className="mono">{account.accountId}</strong></div><div><small>Balance</small><strong className="money">{formatCurrency(Number(account.balance))}</strong></div></Link>)}</div>}</article></section></>
}
