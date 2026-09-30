import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { adminApi } from '../api/adminApi'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, PageLoading } from '../components/ui/States'
import type { WhoAmIResponse } from '../types/api'
import { getErrorMessage } from '../utils/errors'

export function AdminPage() {
  const [identity, setIdentity] = useState<WhoAmIResponse | null>(null); const [error, setError] = useState('')
  useEffect(() => { adminApi.whoAmI().then(setIdentity).catch((cause) => setError(getErrorMessage(cause))) }, [])
  if (error) return <ErrorState title="Admin verification failed" message={error} />
  if (!identity) return <PageLoading />
  return <><PageHeader title="Administration" /><section className="grouped-section admin-card"><span className="admin-card__icon"><ShieldCheck size={28} /></span><div><h2>{identity.username}</h2></div><dl className="details-list"><div><dt>Roles</dt><dd>{identity.roles.map((role) => <span className="badge" key={role}>{role}</span>)}</dd></div></dl></section></>
}
