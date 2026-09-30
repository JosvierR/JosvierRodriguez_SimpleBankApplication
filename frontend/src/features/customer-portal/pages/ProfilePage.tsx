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

export function ProfilePage() {
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
      notify('Profile updated.');
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
      <PageHeader title="Profile" />
      <section className="profile-layout">
        <form className="grouped-section" onSubmit={submit}>
          {error && (
            <div className="form-error" role="alert">
              {error}
            </div>
          )}
          <label>
            Name
            <input name="name" defaultValue={me.profile.name} required />
          </label>
          <label>
            Email
            <input name="email" type="email" defaultValue={me.profile.email} required />
          </label>
          <button className="button" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
        <aside className="profile-meta">
          <span>Access username</span>
          <strong>{me.username}</strong>
          <span>Customer since</span>
          <strong>{formatDateTime(me.profile.createdAt)}</strong>
        </aside>
      </section>
    </>
  );
}
