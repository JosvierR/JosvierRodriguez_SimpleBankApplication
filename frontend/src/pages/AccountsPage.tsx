import { Plus, Search, SlidersHorizontal } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { accountsApi } from '../api/accountsApi'
import { useAuth } from '../auth/useAuth'
import { PageHeader } from '../components/ui/PageHeader'
import { RowAction, RowActions } from '../components/ui/RowActions'
import { EmptyState, PageLoading } from '../components/ui/States'
import type { AccountResponse, AccountType } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function AccountsPage() {
  const { primaryRole } = useAuth()
  const canOpen = primaryRole === 'TELLER' || primaryRole === 'MANAGER' || primaryRole === 'ADMIN'
  const canPremium = primaryRole === 'MANAGER' || primaryRole === 'AUDITOR' || primaryRole === 'ADMIN'
  const [accounts, setAccounts] = useState<AccountResponse[] | null>(null); const [error, setError] = useState(''); const [query, setQuery] = useState(''); const [type, setType] = useState<AccountType | 'ALL'>('ALL'); const [threshold, setThreshold] = useState(''); const [premiumActive, setPremiumActive] = useState(false)
  const load = useCallback(async () => { setError(''); try { setAccounts(await accountsApi.list()); setPremiumActive(false) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  async function premium(event: FormEvent) { event.preventDefault(); const value = Number(threshold); if (threshold === '' || value < 0 || !/^\d+(\.\d{1,2})?$/.test(threshold)) { setError('Enter a non-negative threshold with no more than 2 decimal places.'); return } setError(''); try { setAccounts(await accountsApi.premium(value)); setPremiumActive(true) } catch (cause) { setError(getErrorMessage(cause)) } }
  const filtered = useMemo(() => (accounts || []).filter((account) => (type === 'ALL' || account.accountType === type) && `${account.accountId} ${account.userName}`.toLowerCase().includes(query.toLowerCase())), [accounts, type, query])
  if (!accounts && !error) return <PageLoading />
  return <><PageHeader title="Accounts" actions={canOpen && <Link className="button" to="/accounts/new"><Plus size={17} />Open account</Link>} />{error && <div className="inline-notice inline-notice--error" role="alert">{error}</div>}<section className="grouped-section"><div className="toolbar toolbar--wrap"><label className="search-field"><Search size={17} /><span className="sr-only">Search accounts</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer or account ID" /></label><label className="compact-field"><span className="sr-only">Filter account type</span><select value={type} onChange={(event) => setType(event.target.value as AccountType | 'ALL')}><option value="ALL">All types</option><option value="CHECKING">Checking</option><option value="SAVINGS">Savings</option></select></label>{canPremium && <form className="premium-filter" onSubmit={premium}><SlidersHorizontal size={16} /><label><span className="sr-only">Premium balance threshold</span><input inputMode="decimal" value={threshold} onChange={(event) => setThreshold(event.target.value)} placeholder="Minimum balance" /></label><button className="button button--secondary button--small">Apply</button>{premiumActive && <button className="link-button" type="button" onClick={() => { setThreshold(''); void load() }}>Clear</button>}</form>}</div>{accounts && accounts.length === 0 ? <EmptyState title={premiumActive ? 'No premium accounts' : 'No accounts'} message={premiumActive ? 'No account meets this balance threshold.' : 'No accounts are available.'} action={canOpen && !premiumActive && <Link className="button" to="/accounts/new">Open account</Link>} /> : filtered.length === 0 ? <EmptyState title="No matching accounts" message="Adjust the search or account type filter." /> : <div className="table-wrap"><table><thead><tr><th>Account</th><th>Customer</th><th>Type</th><th className="money-cell">Balance</th><th>Opened</th><th className="actions-cell"><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((account) => <tr key={account.accountId}><td className="mono">•••• {account.accountId.slice(-6)}</td><td><strong>{account.userName}</strong></td><td>{account.accountType === 'CHECKING' ? 'Checking' : 'Savings'}</td><td className="money-cell">{formatCurrency(Number(account.balance))}</td><td>{formatDateTime(account.createdAt)}</td><td className="actions-cell"><RowActions label={`Actions for account ${account.accountId}`}><RowAction to={`/accounts/${account.accountId}`}>View account</RowAction><RowAction to={`/accounts/${account.accountId}/transactions`}>Transactions</RowAction></RowActions></td></tr>)}</tbody></table></div>}</section></>
}
