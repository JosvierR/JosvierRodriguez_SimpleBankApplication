import { useCallback, useEffect, useState } from 'react'
import { ArrowLeftRight, ArrowUpRight, Landmark, Users, WalletCards } from 'lucide-react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { auditsApi } from '../api/auditsApi'
import { usersApi } from '../api/usersApi'
import { ErrorState, EmptyState, PageLoading } from '../components/ui/States'
import { PageHeader } from '../components/ui/PageHeader'
import type { AccountResponse, AuditResponse, UserResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function DashboardPage() {
  const [data, setData] = useState<{ users: UserResponse[]; accounts: AccountResponse[]; audits: AuditResponse[] } | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try { const [users, accounts, audits] = await Promise.all([usersApi.list(), accountsApi.list(), auditsApi.list()]); setData({ users, accounts, audits }) }
    catch (cause) { setError(getErrorMessage(cause)) }
  }, [])
  useEffect(() => { void load() }, [load])
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!data) return <PageLoading rows={6} />
  const totalBalance = data.accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const recent = [...data.audits].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6)
  const metrics = [
    { label: 'Customers', value: data.users.length.toLocaleString(), icon: Users },
    { label: 'Accounts', value: data.accounts.length.toLocaleString(), icon: WalletCards },
    { label: 'Total balance', value: formatCurrency(totalBalance), icon: Landmark },
    { label: 'Recent operations', value: recent.length.toLocaleString(), icon: ArrowLeftRight },
  ]
  return <><PageHeader eyebrow="Executive workspace" title="Bank overview" description="A current view of customers, accounts, balances, and recorded money movement." actions={<Link className="button" to="/accounts/new">Open account</Link>} /><section className="metric-grid" aria-label="Bank metrics">{metrics.map(({ label, value, icon: Icon }) => <article className="metric-card" key={label}><div className="metric-card__top"><span>{label}</span><Icon size={18} /></div><strong>{value}</strong><small>Current backend data</small></article>)}</section><section className="dashboard-grid"><article className="panel"><div className="section-heading"><div><h2>Quick actions</h2><p>Common operations, one step away.</p></div></div><div className="quick-actions"><Link to="/accounts/new"><span className="quick-actions__icon"><WalletCards size={20} /></span><span><strong>Open account</strong><small>New or existing customer</small></span><ArrowUpRight size={17} /></Link><Link to="/transfer"><span className="quick-actions__icon"><ArrowLeftRight size={20} /></span><span><strong>Transfer funds</strong><small>Move money between accounts</small></span><ArrowUpRight size={17} /></Link><Link to="/accounts"><span className="quick-actions__icon"><Landmark size={20} /></span><span><strong>View accounts</strong><small>Balances and account details</small></span><ArrowUpRight size={17} /></Link></div></article><article className="panel panel--wide"><div className="section-heading"><div><h2>Recent activity</h2><p>Latest successful money operations.</p></div><Link to="/audits">View all</Link></div>{recent.length === 0 ? <EmptyState title="No operations yet" message="Deposits, withdrawals, and transfers will appear here." /> : <div className="activity-list">{recent.map((audit) => <div className="activity-row" key={audit.id}><span className={`operation-dot operation-dot--${audit.action.toLowerCase()}`} /><div><strong>{audit.action.replaceAll('_', ' ')}</strong><small>{audit.userName} · by {audit.actorUsername || 'Legacy / unavailable'}</small></div><div><strong>{formatCurrency(Number(audit.amount))}</strong><small>{formatDateTime(audit.createdAt)}</small></div></div>)}</div>}</article></section></>
}
