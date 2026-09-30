import { useState, type FormEvent } from 'react'
import { Building2, CircleCheck } from 'lucide-react'
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
    event.preventDefault()
    setError(''); setBusy(true)
    try {
      await auth.login({ username, password })
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'
      navigate(destination, { replace: true })
    } catch (cause) { setError(getErrorMessage(cause, 'Sign in failed.')) }
    finally { setBusy(false) }
  }

  return <main className="auth-page"><section className="auth-intro"><div className="auth-brand"><span className="brand-mark"><Building2 size={22} /></span><span>Simple Bank</span></div><div><p className="eyebrow">Operations, made clear</p><h1>Confident decisions start with a clear view.</h1><p>Manage customers, accounts, money movement, and compliance records from one focused workspace.</p><ul><li><CircleCheck size={17} />Live backend data</li><li><CircleCheck size={17} />Verified access</li><li><CircleCheck size={17} />Traceable operations</li></ul></div><small>Educational banking application</small></section><section className="auth-panel"><form className="auth-card" onSubmit={submit}><div><p className="eyebrow">Welcome back</p><h2>Sign in to Simple Bank</h2><p>Use your operations account to continue.</p></div>{error && <div className="form-error" role="alert">{error}</div>}<label>Username<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label><button className="button button--wide" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="auth-switch">Need access? <Link to="/register">Create an account</Link></p></form></section></main>
}
