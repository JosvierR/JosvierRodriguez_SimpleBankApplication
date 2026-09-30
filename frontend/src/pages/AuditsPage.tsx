import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { auditsApi } from '../api/auditsApi'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import type { AuditResponse } from '../types/api'
import { formatCurrency } from '../utils/currency'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function AuditsPage() {
  const [audits, setAudits] = useState<AuditResponse[] | null>(null); const [error, setError] = useState(''); const [query, setQuery] = useState('')
  const load = useCallback(async () => { setError(''); try { setAudits(await auditsApi.list()) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => [...(audits || [])].reverse().filter((audit) => `${audit.action} ${audit.userName} ${audit.actorUsername || ''} ${audit.accountIds.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [audits, query])
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!audits) return <PageLoading />
  return <><PageHeader eyebrow="Compliance workspace" title="Audit trail" description="Successful money movements, clearly attributed to the customer involved and the authenticated operator." /><section className="definition-strip"><div><strong>Bank customer</strong><span>Whose account or money was involved</span></div><div><strong>Authenticated actor</strong><span>The API user who performed the operation</span></div></section><section className="panel"><div className="toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search audits</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search action, customer, actor, or account" /></label><span className="result-count">{filtered.length} record{filtered.length === 1 ? '' : 's'}</span></div>{audits.length === 0 ? <EmptyState title="No audits yet" message="Successful deposits, withdrawals, and transfers will appear here." /> : filtered.length === 0 ? <EmptyState title="No matching records" message="Try a different search term." /> : <div className="table-wrap"><table><thead><tr><th>Action</th><th>Bank customer</th><th>Authenticated actor</th><th>Accounts</th><th className="money-cell">Amount</th><th>Timestamp</th></tr></thead><tbody>{filtered.map((audit) => <tr key={audit.id}><td><span className="badge badge--action">{audit.action.replaceAll('_', ' ')}</span></td><td><strong>{audit.userName}</strong><small className="table-subtext mono">{audit.userId}</small></td><td><strong>{audit.actorUsername || 'Legacy / unavailable'}</strong>{audit.actorAuthUserId && <small className="table-subtext mono">{audit.actorAuthUserId}</small>}</td><td>{audit.accountIds.map((id) => <small className="table-subtext mono" key={id}>{id}</small>)}</td><td className="money-cell">{formatCurrency(Number(audit.amount))}</td><td>{formatDateTime(audit.createdAt)}</td></tr>)}</tbody></table></div>}</section></>
}
