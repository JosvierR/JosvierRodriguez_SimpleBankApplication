import { Building2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { appPath } from '@/app/routes';
import { useAuth } from '@/shared/auth/useAuth';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { getErrorMessage } from '@/shared/utils/errors';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const auth = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (auth.isAuthenticated) return <Navigate to={appPath()} replace />;
  const bytes = new TextEncoder().encode(form.password).length;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (form.password.length < 8 || bytes > 72) {
      setError(t('passwordPolicy'));
      return;
    }
    setBusy(true);
    try {
      await auth.register(form);
      navigate(appPath(), { replace: true });
    } catch (cause) {
      setError(getErrorMessage(cause, t('registerFailed')));
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
          <h1>{t('createAccount')}</h1>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <label>
            {t('username')}
            <input
              autoComplete="username"
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value })}
              required
              autoFocus
            />
          </label>
          <label>
            {t('email')}
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            {t('password')}
            <input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              aria-describedby="password-help"
            />
          </label>
          <p id="password-help" className="field-help">
            {t('passwordHelp', { bytes })}
          </p>
          <button className="button button--wide" disabled={busy}>
            {busy ? t('signingIn') : t('createAccount')}
          </button>
          <p className="auth-switch">
            <Link to="/login">{t('signIn')}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
