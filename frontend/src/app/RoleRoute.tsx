import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import type { Role } from '@/shared/types/api';

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { t } = useTranslation('banking');
  const { primaryRole } = useAuth();
  if (!primaryRole || !allow.includes(primaryRole))
    return (
      <section className="access-denied">
        <h1>{t('accessDenied')}</h1>
        <p>{t('accessDeniedBody')}</p>
      </section>
    );
  return <Outlet />;
}
