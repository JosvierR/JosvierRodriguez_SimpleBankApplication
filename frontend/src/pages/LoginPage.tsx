import { Building2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { getErrorMessage } from '../utils/errors'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (auth.isAuthenticated) return <Navigate to="/" replace />

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true)
    try { await auth.login({ username, password }); const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'; navigate(destination, { replace: true }) }
    catch (cause) { setError(getErrorMessage(cause, 'Sign in failed.')) }
    finally { setBusy(false) }
  }

  return <main className="auth-page auth-page--compact"><section className="auth-panel"><form className="auth-card" onSubmit={submit}><div className="auth-brand"><span className="brand-mark"><Building2 size={20} /></span><span>Simple Bank</span></div><h1>Sign in</h1>{error && <div className="form-error" role="alert">{error}</div>}<label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="button button--wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="auth-switch"><Link to="/register">Create account</Link></p></form></section></main>
}
