import { useEffect, useState, type FormEvent } from 'react';
import { meApi } from '@/features/customer-portal/api/meApi';
import { useAuth } from '@/shared/auth/useAuth';
import { PendingLinkState } from '@/features/customer-portal/components/PendingLinkState';
import { PageHeader } from '@/shared/components/PageHeader';
import { PageLoading } from '@/shared/components/States';
import { useToast } from '@/shared/components/Toast';
import type { CustomerMeResponse } from '@/shared/types/api';
import { formatDateTime } from '@/shared/utils/dates';
import { getErrorMessage } from '@/shared/utils/errors';
import { useTranslation } from 'react-i18next';

export function ProfilePage() {
  const { t } = useTranslation(['banking', 'common']);
  const { bankUserLinked } = useAuth();
  const { notify } = useToast();
  const [me, setMe] = useState<CustomerMeResponse | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    meApi
      .get()
      .then(setMe)
      .catch((cause) => setError(getErrorMessage(cause)));
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const profile = await meApi.updateProfile({ name: String(form.get('name')), email: String(form.get('email')) });
      setMe((current) => (current ? { ...current, profile } : current));
      notify(t('profileUpdated'));
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setBusy(false);
    }
  }
  if (!me) return <PageLoading />;
  if (!bankUserLinked || !me.profile) return <PendingLinkState />;
  return (
    <>
      <PageHeader title={t('common:nav.profile')} />
      <section className="profile-layout">
        <form className="grouped-section" onSubmit={submit}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <label>
            {t('name')}
            <input name="name" defaultValue={me.profile.name} required />
          </label>
          <label>
            {t('email')}
            <input name="email" type="email" defaultValue={me.profile.email} required />
          </label>
          <button className="button" disabled={busy}>
            {busy ? t('saving') : t('common:save')}
          </button>
        </form>
        <aside className="profile-meta">
          <span>{t('accessUsername')}</span>
          <strong>{me.username}</strong>
          <span>{t('customerSince')}</span>
          <strong>{formatDateTime(me.profile.createdAt)}</strong>
        </aside>
      </section>
    </>
  );
}
