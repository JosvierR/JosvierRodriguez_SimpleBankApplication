import { useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCircle2, UserPlus, Users } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { usersApi } from '../api/usersApi'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { AccountType, UserResponse } from '../types/api'
import { getErrorMessage } from '../utils/errors'

export function CreateAccountPage() {
  const [params] = useSearchParams(); const presetUserId = params.get('userId') || ''
  const [mode, setMode] = useState<'new' | 'existing'>(presetUserId ? 'existing' : 'new'); const [users, setUsers] = useState<UserResponse[] | null>(null)
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [userId, setUserId] = useState(presetUserId); const [accountType, setAccountType] = useState<AccountType>('CHECKING')
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [partialUser, setPartialUser] = useState<UserResponse | null>(null)
  const navigate = useNavigate(); const { notify } = useToast()
  useEffect(() => { usersApi.list().then(setUsers).catch((cause) => setError(getErrorMessage(cause))) }, [])
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true); setPartialUser(null)
    try {
      let ownerId = userId
      if (mode === 'new') {
        const customer = await usersApi.create({ name, email })
        ownerId = customer.id
        try { const account = await accountsApi.create({ userId: ownerId, accountType }); notify('Customer created and account opened.'); navigate(`/accounts/${account.accountId}`); return }
        catch (cause) { setPartialUser(customer); setUserId(customer.id); setError(`Customer was created, but the account could not be opened. ${getErrorMessage(cause)}`); return }
      }
      if (!ownerId) { setError('Select an existing customer.'); return }
      const account = await accountsApi.create({ userId: ownerId, accountType }); notify('Account opened.'); navigate(`/accounts/${account.accountId}`)
    } catch (cause) { setError(getErrorMessage(cause)) }
    finally { setBusy(false) }
  }
  if (!users && !error) return <PageLoading />
  return <><Link className="back-link" to="/accounts"><ArrowLeft size={16} />Accounts</Link><PageHeader eyebrow="Account opening" title="Open account" description="Create a customer and account together, or add another account to an existing customer." /><section className="form-layout"><article className="panel form-panel"><div className="segmented" role="group" aria-label="Customer type"><button type="button" className={mode === 'new' ? 'active' : ''} onClick={() => { setMode('new'); setPartialUser(null); setError('') }}><UserPlus size={17} />New customer</button><button type="button" className={mode === 'existing' ? 'active' : ''} onClick={() => { setMode('existing'); setPartialUser(null); setError('') }}><Users size={17} />Existing customer</button></div>{error && <div className={`form-error ${partialUser ? 'form-error--recovery' : ''}`} role="alert"><strong>{partialUser ? 'Account opening needs attention' : 'Unable to open account'}</strong><span>{error}</span>{partialUser && <span>Customer ID: <code>{partialUser.id}</code></span>}</div>}<form onSubmit={submit}>{mode === 'new' ? <><label>Customer name<input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="Full name" /></label><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="customer@example.com" /></label></> : <label>Customer<select value={userId} onChange={(e) => setUserId(e.target.value)} required autoFocus><option value="">Select a customer</option>{users?.map((user) => <option value={user.id} key={user.id}>{user.name} — {user.email}</option>)}</select></label>}<fieldset><legend>Account type</legend><div className="choice-grid"><label className={accountType === 'CHECKING' ? 'choice-card active' : 'choice-card'}><input type="radio" name="accountType" value="CHECKING" checked={accountType === 'CHECKING'} onChange={() => setAccountType('CHECKING')} /><span><strong>Checking</strong><small>For everyday operations</small></span><CheckCircle2 size={18} /></label><label className={accountType === 'SAVINGS' ? 'choice-card active' : 'choice-card'}><input type="radio" name="accountType" value="SAVINGS" checked={accountType === 'SAVINGS'} onChange={() => setAccountType('SAVINGS')} /><span><strong>Savings</strong><small>For held balances</small></span><CheckCircle2 size={18} /></label></div></fieldset><button className="button" disabled={busy}>{busy ? 'Opening account…' : partialUser ? 'Try opening account again' : 'Open account'}</button></form>{partialUser && <button className="button button--secondary recovery-action" type="button" onClick={() => { setMode('existing'); setUserId(partialUser.id); setError(''); setPartialUser(null) }}>Open account for this customer</button>}</article><aside className="panel form-aside"><p className="eyebrow">What happens next</p><h2>A clean two-step workflow</h2><ol><li><span>1</span><div><strong>Customer profile</strong><p>{mode === 'new' ? 'A new profile is created from the name and email.' : 'The selected customer remains unchanged.'}</p></div></li><li><span>2</span><div><strong>Account opened</strong><p>The backend creates a zero-balance {accountType.toLowerCase()} account.</p></div></li></ol><p className="aside-note">If step two fails after a new profile is created, the customer is preserved and you’ll receive a recovery action.</p></aside></section></>
}
