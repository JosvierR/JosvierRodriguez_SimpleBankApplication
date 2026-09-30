import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, CheckCircle2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { AccountResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { amountError, getErrorMessage } from '../utils/errors'

export function MoneyMovementPage({ kind }: { kind: 'deposit' | 'withdraw' }) {
  const { accountId = '' } = useParams(); const { notify } = useToast(); const [account, setAccount] = useState<AccountResponse | null>(null); const [amount, setAmount] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [complete, setComplete] = useState(false)
  const isDeposit = kind === 'deposit'; const load = useCallback(async () => { setError(''); try { setAccount(await accountsApi.get(accountId)) } catch (cause) { setError(getErrorMessage(cause)) } }, [accountId])
  useEffect(() => { void load() }, [load])
  async function submit(event: FormEvent) { event.preventDefault(); const validation = amountError(amount); if (validation) { setError(validation); return } setBusy(true); setError(''); try { const updated = isDeposit ? await accountsApi.deposit(accountId, Number(amount)) : await accountsApi.withdraw(accountId, Number(amount)); setAccount(updated); setComplete(true); notify(isDeposit ? 'Deposit complete.' : 'Withdrawal complete.') } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  if (!account && error) return <ErrorState title="Account unavailable" message={error} onRetry={() => void load()} />
  if (!account) return <PageLoading />
  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine
  return <><Link className="back-link" to={`/accounts/${accountId}`}><ArrowLeft size={16} />Back to account</Link><PageHeader eyebrow="Money movement" title={isDeposit ? 'Deposit funds' : 'Withdraw funds'} description={`${account.userName} · ${account.accountType.toLowerCase()} account`} /><section className="money-layout"><article className="panel money-form"><div className="current-balance"><span>Current balance</span><strong>{formatCurrency(Number(account.balance))}</strong></div>{complete ? <div className="success-state" role="status"><CheckCircle2 size={34} /><h2>{isDeposit ? 'Deposit complete' : 'Withdrawal complete'}</h2><p>New balance</p><strong>{formatCurrency(Number(account.balance))}</strong><div><Link className="button" to={`/accounts/${accountId}`}>Back to account</Link><button className="button button--secondary" type="button" onClick={() => { setAmount(''); setComplete(false) }}>{isDeposit ? 'Make another deposit' : 'Make another withdrawal'}</button></div></div> : <form onSubmit={submit}>{error && <div className="form-error" role="alert">{error}</div>}<label htmlFor="movement-amount">Amount</label><div className="currency-input"><span>$</span><input id="movement-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required autoFocus /></div><p className="field-help">Enter an amount greater than 0 with no more than 2 decimal places.</p><button className="button" disabled={busy}><Icon size={17} />{busy ? 'Processing…' : isDeposit ? 'Complete deposit' : 'Complete withdrawal'}</button></form>}</article><aside className="panel form-aside"><p className="eyebrow">Account</p><h2 className="mono">{account.accountId}</h2><dl className="mini-details"><div><dt>Customer</dt><dd>{account.userName}</dd></div><div><dt>Type</dt><dd>{account.accountType}</dd></div></dl></aside></section></>
}

export function DepositPage() { return <MoneyMovementPage kind="deposit" /> }
export function WithdrawPage() { return <MoneyMovementPage kind="withdraw" /> }
