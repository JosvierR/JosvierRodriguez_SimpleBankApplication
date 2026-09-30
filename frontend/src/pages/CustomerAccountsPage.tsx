import { ArrowLeft, ArrowLeftRight, History } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { meApi } from '../api/meApi'
import { useAuth } from '../auth/useAuth'
import { PendingLinkState } from '../components/customer/PendingLinkState'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import type { CustomerAccountResponse, CustomerTransactionResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function MyAccountsPage() {
  const { bankUserLinked } = useAuth()
  const [accounts, setAccounts] = useState<CustomerAccountResponse[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { setAccounts(await meApi.accounts()) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { if (bankUserLinked) void load() }, [bankUserLinked, load])
  if (!bankUserLinked) return <PendingLinkState />
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!accounts) return <PageLoading />
  return <><PageHeader title="My Accounts" />{accounts.length === 0 ? <EmptyState title="No accounts" message="No accounts are connected to your customer profile." /> : <section className="customer-account-grid">{accounts.map((account) => <Link className="customer-account" to={`/my-accounts/${account.accountId}`} key={account.accountId}><div><span>{account.accountType === 'CHECKING' ? 'Checking' : 'Savings'}</span><small className="mono">•••• {account.accountId.slice(-4)}</small></div><strong>{formatCurrency(Number(account.balance))}</strong><small>Opened {formatDateTime(account.createdAt)}</small></Link>)}</section>}</>
}

export function MyAccountDetailsPage() {
  const { accountId = '' } = useParams()
  const { bankUserLinked } = useAuth()
  const [data, setData] = useState<{ account: CustomerAccountResponse; transactions: CustomerTransactionResponse[] } | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { const [account, transactions] = await Promise.all([meApi.account(accountId), meApi.transactions(accountId)]); setData({ account, transactions }) } catch (cause) { setError(getErrorMessage(cause)) } }, [accountId])
  useEffect(() => { if (bankUserLinked) void load() }, [bankUserLinked, load])
  if (!bankUserLinked) return <PendingLinkState />
  if (error) return <ErrorState title="Account unavailable" message={error} onRetry={() => void load()} />
  if (!data) return <PageLoading />
  const recent = [...data.transactions].reverse().slice(0, 5)
  return <><Link className="back-link" to="/my-accounts"><ArrowLeft size={16} />My Accounts</Link><PageHeader title={data.account.accountType === 'CHECKING' ? 'Checking account' : 'Savings account'} description={`Account ending ${data.account.accountId.slice(-4)}`} /><section className="customer-balance"><span>Available balance</span><strong>{formatCurrency(Number(data.account.balance))}</strong><div><Link className="button" to={`/my-transfer?from=${accountId}`}><ArrowLeftRight size={17} />Transfer</Link><Link className="button button--secondary" to={`/my-accounts/${accountId}/transactions`}><History size={17} />Transactions</Link></div></section><section className="grouped-section"><div className="section-heading"><h2>Recent activity</h2><Link to={`/my-accounts/${accountId}/transactions`}>View all</Link></div>{recent.length === 0 ? <EmptyState title="No transactions" message="Account activity will appear here." /> : <TransactionRows transactions={recent} />}</section></>
}

export function MyTransactionsPage() {
  const { accountId = '' } = useParams()
  const { bankUserLinked } = useAuth()
  const [transactions, setTransactions] = useState<CustomerTransactionResponse[] | null>(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { setTransactions(await meApi.transactions(accountId)) } catch (cause) { setError(getErrorMessage(cause)) } }, [accountId])
  useEffect(() => { if (bankUserLinked) void load() }, [bankUserLinked, load])
  if (!bankUserLinked) return <PendingLinkState />
  if (error) return <ErrorState title="Transactions unavailable" message={error} onRetry={() => void load()} />
  if (!transactions) return <PageLoading />
  return <><Link className="back-link" to={`/my-accounts/${accountId}`}><ArrowLeft size={16} />Back to account</Link><PageHeader title="Transactions" description={`Account ending ${accountId.slice(-4)}`} /><section className="grouped-section">{transactions.length === 0 ? <EmptyState title="No transactions" message="Account activity will appear here." /> : <TransactionRows transactions={[...transactions].reverse()} />}</section></>
}

function TransactionRows({ transactions }: { transactions: CustomerTransactionResponse[] }) {
  return <div className="customer-transactions">{transactions.map((transaction) => { const deposit = transaction.type === 'DEPOSIT'; return <div key={transaction.transactionId}><span className={`operation-dot operation-dot--${deposit ? 'deposit' : 'withdraw'}`} /><div><strong>{deposit ? 'Deposit' : 'Withdrawal'}</strong><small>{formatDateTime(transaction.createdAt)}</small></div><strong className={deposit ? 'positive' : 'negative'}>{deposit ? '+' : '-'}{formatCurrency(Math.abs(Number(transaction.amount)))}</strong></div> })}</div>
}
