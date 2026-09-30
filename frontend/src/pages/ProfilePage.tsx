import { useEffect, useState, type FormEvent } from 'react'
import { meApi } from '../api/meApi'
import { useAuth } from '../auth/useAuth'
import { PendingLinkState } from '../components/customer/PendingLinkState'
import { PageHeader } from '../components/ui/PageHeader'
import { PageLoading } from '../components/ui/States'
import { useToast } from '../components/ui/Toast'
import type { CustomerMeResponse } from '../types/api'
import { formatDateTime } from '../utils/dates'
import { getErrorMessage } from '../utils/errors'

export function ProfilePage() {
  const { bankUserLinked } = useAuth()
  const { notify } = useToast()
  const [me, setMe] = useState<CustomerMeResponse | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { meApi.get().then(setMe).catch((cause) => setError(getErrorMessage(cause))) }, [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget); try { const profile = await meApi.updateProfile({ name: String(form.get('name')), email: String(form.get('email')) }); setMe((current) => current ? { ...current, profile } : current); notify('Profile updated.') } catch (cause) { setError(getErrorMessage(cause)) } finally { setBusy(false) } }
  if (!me) return <PageLoading />
  if (!bankUserLinked || !me.profile) return <PendingLinkState />
  return <><PageHeader title="Profile" /><section className="profile-layout"><form className="grouped-section" onSubmit={submit}>{error && <div className="form-error" role="alert">{error}</div>}<label>Name<input name="name" defaultValue={me.profile.name} required /></label><label>Email<input name="email" type="email" defaultValue={me.profile.email} required /></label><button className="button" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></form><aside className="profile-meta"><span>Access username</span><strong>{me.username}</strong><span>Customer since</span><strong>{formatDateTime(me.profile.createdAt)}</strong></aside></section></>
}
