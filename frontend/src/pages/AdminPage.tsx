import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { adminApi } from '../api/auditsApi'
import { PageHeader } from '../components/ui/PageHeader'
import { ErrorState, PageLoading } from '../components/ui/States'
import type { WhoAmIResponse } from '../types/api'
import { getErrorMessage } from '../utils/errors'

export function AdminPage() {
  const [identity, setIdentity] = useState<WhoAmIResponse | null>(null); const [error, setError] = useState('')
  useEffect(() => { adminApi.whoAmI().then(setIdentity).catch((cause) => setError(getErrorMessage(cause))) }, [])
  if (error) return <ErrorState title="Admin verification failed" message={error} />
  if (!identity) return <PageLoading />
  return <><PageHeader eyebrow="Security demonstration" title="Admin access" description="This page verifies role-protected access against the backend." /><section className="panel admin-card"><span className="admin-card__icon"><ShieldCheck size={28} /></span><div><h2>Admin access verified</h2><p>The authenticated backend identity has the required ADMIN role.</p></div><dl className="details-list"><div><dt>Username</dt><dd>{identity.username}</dd></div><div><dt>Roles</dt><dd>{identity.roles.map((role) => <span className="badge" key={role}>{role}</span>)}</dd></div></dl></section></>
}
