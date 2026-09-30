import { useState, type FormEvent } from 'react'
import { Building2 } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../utils/errors'

export function RegisterPage() {
  const auth = useAuth(); const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false)
  if (auth.isAuthenticated) return <Navigate to="/" replace />
  const bytes = new TextEncoder().encode(form.password).length
  async function submit(event: FormEvent) {
    event.preventDefault(); setError('')
    if (form.password.length < 8 || bytes > 72) { setError('Password must be at least 8 characters and no more than 72 UTF-8 bytes.'); return }
    setBusy(true)
    try { await auth.register(form); navigate('/', { replace: true }) }
    catch (cause) { setError(getErrorMessage(cause, 'Registration failed.')) }
    finally { setBusy(false) }
  }
  return <main className="auth-page"><section className="auth-intro"><div className="auth-brand"><span className="brand-mark"><Building2 size={22} /></span><span>Simple Bank</span></div><div><p className="eyebrow">Secure access</p><h1>Create your operations workspace.</h1><p>Registration creates an API login with standard USER access. It does not create a bank customer.</p></div><small>Educational banking application</small></section><section className="auth-panel"><form className="auth-card" onSubmit={submit}><div><p className="eyebrow">Create access</p><h2>Register</h2><p>All new registrations receive the USER role.</p></div>{error && <div className="form-error" role="alert">{error}</div>}<label>Username<input autoComplete="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required autoFocus /></label><label>Email<input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label>Password<input type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required aria-describedby="password-help" /></label><p id="password-help" className="field-help">8+ characters, no more than 72 UTF-8 bytes ({bytes}/72).</p><button className="button button--wide" disabled={busy}>{busy ? 'Creating access…' : 'Create access account'}</button><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p></form></section></main>
}
