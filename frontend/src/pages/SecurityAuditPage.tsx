import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, PageLoading } from '../components/ui/States'
import type { SecurityAuditResponse } from '../types/api'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function SecurityAuditPage() {
  const [audits, setAudits] = useState<SecurityAuditResponse[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const load = useCallback(async () => { setError(''); try { setAudits(await adminApi.securityAudits()) } catch (cause) { setError(getErrorMessage(cause)) } }, [])
  useEffect(() => { void load() }, [load])
  const filtered = useMemo(() => (audits || []).filter((audit) => `${audit.action} ${audit.actorUsername} ${audit.targetAuthUserId}`.toLowerCase().includes(query.toLowerCase())), [audits, query])
  if (error) return <ErrorState message={error} onRetry={() => void load()} />
  if (!audits) return <PageLoading />
  return <><PageHeader title="Security audit" /><section className="grouped-section"><div className="toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search security audit</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, actor, or target" /></label></div>{filtered.length === 0 ? <EmptyState title="No security changes" message="Access-management changes will appear here." /> : <div className="table-wrap"><table><thead><tr><th>Action</th><th>Actor</th><th>Target identity</th><th>Previous</th><th>New</th><th>Timestamp</th></tr></thead><tbody>{filtered.map((audit) => <tr key={audit.id}><td>{audit.action.replaceAll('_', ' ')}</td><td>{audit.actorUsername}</td><td className="mono">{audit.targetAuthUserId}</td><td>{audit.previousValue || '—'}</td><td>{audit.newValue || '—'}</td><td>{formatDateTime(audit.createdAt)}</td></tr>)}</tbody></table></div>}</section></>
}
