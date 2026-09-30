import { ArrowLeftRight, Landmark, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { adminApi } from '../api/adminApi'
import { auditsApi } from '../api/auditsApi'
import { meApi } from '../api/meApi'
import { usersApi } from '../api/usersApi'
import { useAuth } from '../auth/useAuth'
import { PendingLinkState } from '../components/customer/PendingLinkState'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import type { AccountResponse, AdminAuthUserResponse, AuditResponse, CustomerAccountResponse, CustomerTransactionResponse, SecurityAuditResponse, UserResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

interface DashboardData {
  users: UserResponse[]
  accounts: AccountResponse[]
  audits: AuditResponse[]
  authUsers: AdminAuthUserResponse[]
  securityAudits: SecurityAuditResponse[]
  ownAccounts: CustomerAccountResponse[]
  ownTransactions: CustomerTransactionResponse[]
}

const empty: DashboardData = { users: [], accounts: [], audits: [], authUsers: [], securityAudits: [], ownAccounts: [], ownTransactions: [] }

export function DashboardPage() {
  const { primaryRole, bankUserLinked } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    if (!primaryRole || (primaryRole === 'CUSTOMER' && !bankUserLinked)) return
    setError('')
    try {
      if (primaryRole === 'CUSTOMER') {
        const ownAccounts = await meApi.accounts()
        const histories = await Promise.all(ownAccounts.map((account) => meApi.transactions(account.accountId)))
        setData({ ...empty, ownAccounts, ownTransactions: histories.flat() })
        return
      }
      const [users, accounts] = await Promise.all([usersApi.list(), accountsApi.list()])
      if (primaryRole === 'TELLER') { setData({ ...empty, users, accounts }); return }
      const audits = await auditsApi.list()
      if (primaryRole !== 'ADMIN') { setData({ ...empty, users, accounts, audits }); return }
      const [authUsers, securityAudits] = await Promise.all([adminApi.users(), adminApi.securityAudits()])
      setData({ ...empty, users, accounts, audits, authUsers, securityAudits })
    } catch (cause) { setError(getErrorMessage(cause)) }
  }, [primaryRole, bankUserLinked])
  useEffect(() => { void load() }, [load])
  if (primaryRole === 'CUSTOMER' && !bankUserLinked) return <PendingLinkState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!data || !primaryRole) return <PageLoading rows={6} />
  if (primaryRole === 'CUSTOMER') return <CustomerOverview accounts={data.ownAccounts} transactions={data.ownTransactions} />
  return <StaffOverview role={primaryRole} data={data} />
}

function CustomerOverview({ accounts, transactions }: { accounts: CustomerAccountResponse[]; transactions: CustomerTransactionResponse[] }) {
  const total = accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const recent = [...transactions].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6)
  return <><PageHeader title="Overview" /><section className="overview-metrics"><div><span>Total balance</span><strong>{formatCurrency(total)}</strong></div><div><span>My accounts</span><strong>{accounts.length}</strong></div><div><span>Recent transactions</span><strong>{recent.length}</strong></div></section><div className="overview-actions"><Link className="button" to="/my-transfer"><ArrowLeftRight size={17} />Transfer</Link><Link className="button button--secondary" to="/my-accounts">View accounts</Link></div><section className="grouped-section"><div className="section-heading"><h2>Recent activity</h2></div>{recent.length === 0 ? <EmptyState title="No recent activity" message="Your transactions will appear here." /> : <div className="customer-transactions">{recent.map((transaction) => { const deposit = transaction.type === 'DEPOSIT'; return <div key={transaction.transactionId}><span className={`operation-dot operation-dot--${deposit ? 'deposit' : 'withdraw'}`} /><div><strong>{deposit ? 'Deposit' : 'Withdrawal'}</strong><small>{formatDateTime(transaction.createdAt)}</small></div><strong className={deposit ? 'positive' : 'negative'}>{deposit ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}</strong></div> })}</div>}</section></>
}

function StaffOverview({ role, data }: { role: Exclude<NonNullable<ReturnType<typeof useAuth>['primaryRole']>, 'CUSTOMER'>; data: DashboardData }) {
  const total = data.accounts.reduce((sum, account) => sum + Number(account.balance), 0)
  const recentAudits = [...data.audits].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 6)
  const metrics = role === 'ADMIN'
    ? [
        { label: 'Customers', value: data.users.length, icon: Users },
        { label: 'Accounts', value: data.accounts.length, icon: WalletCards },
        { label: 'Active access', value: data.authUsers.filter((user) => user.enabled).length, icon: ShieldCheck },
        { label: 'Disabled access', value: data.authUsers.filter((user) => !user.enabled).length, icon: ShieldCheck },
      ]
    : [
        { label: 'Customers', value: data.users.length, icon: Users },
        { label: 'Accounts', value: data.accounts.length, icon: WalletCards },
        { label: 'Total balance', value: formatCurrency(total), icon: Landmark },
        ...(role === 'TELLER' ? [] : [{ label: 'Audit records', value: data.audits.length, icon: ArrowLeftRight }]),
      ]
  const activity = role === 'ADMIN' ? data.securityAudits.slice(0, 6) : recentAudits
  return <><PageHeader title="Overview" actions={(role === 'TELLER' || role === 'MANAGER' || role === 'ADMIN') && <Link className="button" to="/accounts/new">Open account</Link>} /><section className="overview-metrics">{metrics.map(({ label, value, icon: Icon }) => <div key={label}><span><Icon size={16} />{label}</span><strong>{value}</strong></div>)}</section><div className="overview-actions"><Link className="button button--secondary" to="/customers">Customers</Link><Link className="button button--secondary" to="/accounts">Accounts</Link>{(role === 'MANAGER' || role === 'ADMIN') && <Link className="button" to="/transfer">Transfer funds</Link>}{role === 'ADMIN' && <Link className="button button--secondary" to="/admin/access">Manage access</Link>}</div>{role !== 'TELLER' && <section className="grouped-section"><div className="section-heading"><h2>{role === 'ADMIN' ? 'Recent security changes' : 'Recent activity'}</h2>{role === 'ADMIN' && <Link to="/admin/security-audit">View all</Link>}</div>{activity.length === 0 ? <EmptyState title="No recent activity" message="Recorded activity will appear here." /> : role === 'ADMIN' ? <div className="activity-list">{data.securityAudits.slice(0, 6).map((audit) => <div className="activity-row" key={audit.id}><span className="operation-dot" /><div><strong>{audit.action.replaceAll('_', ' ')}</strong><small>{audit.actorUsername}</small></div><small>{formatDateTime(audit.createdAt)}</small></div>)}</div> : <div className="activity-list">{recentAudits.map((audit) => <div className="activity-row" key={audit.id}><span className={`operation-dot operation-dot--${audit.action.toLowerCase()}`} /><div><strong>{audit.action.replaceAll('_', ' ')}</strong><small>{audit.userName} · {audit.actorUsername || 'Legacy / unavailable'}</small></div><div><strong>{formatCurrency(Number(audit.amount))}</strong><small>{formatDateTime(audit.createdAt)}</small></div></div>)}</div>}</section>}</>
}
