import { Building2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../utils/errors'

export function RegisterPage() {
  const auth = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (auth.isAuthenticated) return <Navigate to="/" replace />
  const bytes = new TextEncoder().encode(form.password).length
  async function submit(event: FormEvent) { event.preventDefault(); setError(''); if (form.password.length < 8 || bytes > 72) { setError('Password must be at least 8 characters and no more than 72 UTF-8 bytes.'); return } setBusy(true); try { await auth.register(form); navigate('/', { replace: true }) } catch (cause) { setError(getErrorMessage(cause, 'Registration failed.')) } finally { setBusy(false) } }
  return <main className="auth-page auth-page--compact"><section className="auth-panel"><form className="auth-card" onSubmit={submit}><div className="auth-brand"><span className="brand-mark"><Building2 size={20} /></span><span>Simple Bank</span></div><h1>Create account</h1>{error && <div className="form-error" role="alert">{error}</div>}<label>Username<input autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required autoFocus /></label><label>Email<input type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required aria-describedby="password-help" /></label><p id="password-help" className="field-help">At least 8 characters, and no more than 72 UTF-8 bytes ({bytes}/72).</p><button className="button button--wide" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button><p className="auth-switch"><Link to="/login">Sign in</Link></p></form></section></main>
}
