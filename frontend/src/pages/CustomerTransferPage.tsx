import { ArrowLeftRight, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { meApi } from '../api/meApi'
import { useAuth } from '../auth/useAuth'
import { PendingLinkState } from '../components/customer/PendingLinkState'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, PageLoading } from '../components/ui/States'
import type { CustomerAccountResponse, CustomerTransferResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { amountError, getErrorMessage } from '../utils/errors'

export function CustomerTransferPage() {
  const { bankUserLinked } = useAuth()
  const [params] = useSearchParams()
  const [accounts, setAccounts] = useState<CustomerAccountResponse[] | null>(null)
  const [from, setFrom] = useState(params.get('from') || '')
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<CustomerTransferResponse | null>(null)
  useEffect(() => { if (bankUserLinked) meApi.accounts().then(setAccounts).catch((cause) => setError(getErrorMessage(cause))) }, [bankUserLinked])
  const source = useMemo(() => accounts?.find((account) => account.accountId === from), [accounts, from])
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); const validation = amountError(amount); if (!from || !to) return setError('Select both accounts.'); if (from === to) return setError('Choose two different accounts.'); if (validation) return setError(validation); setBusy(true); try { setResult(await meApi.transfer({ fromAccountId: from, toAccountId: to, amount: Number(amount) })) } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  if (!bankUserLinked) return <PendingLinkState />
  if (!accounts && !error) return <PageLoading />
  return <><PageHeader title="Transfer" />{accounts && accounts.length < 2 ? <EmptyState title="Two accounts required" message="You need at least two linked accounts to make a transfer." /> : <section className="money-layout"><article className="grouped-section transfer-form">{result ? <div className="success-state" role="status"><CheckCircle2 size={32} /><h2>Transfer complete</h2><p>{formatCurrency(Number(result.amount))} was transferred.</p><dl className="transfer-result"><div><dt>Source balance</dt><dd>{formatCurrency(Number(result.fromBalance))}</dd></div><div><dt>Destination balance</dt><dd>{formatCurrency(Number(result.toBalance))}</dd></div></dl><button className="button" type="button" onClick={() => { setResult(null); setAmount('') }}>Make another transfer</button></div> : <form onSubmit={submit}>{error && <div className="form-error" role="alert">{error}</div>}<label>From account<select value={from} onChange={(event) => setFrom(event.target.value)} required><option value="">Select account</option>{accounts?.map((account) => <option value={account.accountId} key={account.accountId}>{account.accountType} •••• {account.accountId.slice(-4)} · {formatCurrency(Number(account.balance))}</option>)}</select></label><label>To account<select value={to} onChange={(event) => setTo(event.target.value)} required><option value="">Select account</option>{accounts?.map((account) => <option value={account.accountId} key={account.accountId} disabled={account.accountId === from}>{account.accountType} •••• {account.accountId.slice(-4)}</option>)}</select></label><label htmlFor="customer-transfer-amount">Amount</label><div className="currency-input"><span>$</span><input id="customer-transfer-amount" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" required /></div><button className="button" disabled={busy}><ArrowLeftRight size={17} />{busy ? 'Transferring…' : 'Transfer funds'}</button></form>}</article><aside className="transfer-summary"><span>From</span><strong>{source ? `${source.accountType} •••• ${source.accountId.slice(-4)}` : 'Select an account'}</strong>{source && <small>Available {formatCurrency(Number(source.balance))}</small>}</aside></section>}</>
}
