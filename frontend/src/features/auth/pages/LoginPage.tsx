import { Building2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { getErrorMessage } from '@/shared/utils/errors';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (auth.isAuthenticated) return <Navigate to={appPath()} replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await auth.login({ username, password });
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(from && from !== '/' ? from : appPath(), { replace: true });
    } catch (cause) {
      setError(getErrorMessage(cause, t('signInFailed')));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page auth-page--compact">
      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit}>
          <div className="auth-brand">
            <span className="brand-mark">
              <Building2 size={20} />
            </span>
            <span>Simple Bank</span>
          </div>
          <LanguageSwitcher />
          <h1>{t('signIn')}</h1>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <label>
            {t('username')}
            <input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required autoFocus />
          </label>
          <label>
            {t('password')}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="button button--wide" disabled={busy}>
            {busy ? t('signingIn') : t('signIn')}
          </button>
          <p className="auth-switch">
            <Link to="/register">{t('createAccount')}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
