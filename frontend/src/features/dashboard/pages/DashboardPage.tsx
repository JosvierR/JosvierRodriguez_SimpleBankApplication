import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import type { RoleDashboardData } from '@/features/dashboard/types/dashboard';
import { AdminDashboard } from '@/features/dashboard/views/AdminDashboard';
import { AuditorDashboard } from '@/features/dashboard/views/AuditorDashboard';
import { CustomerDashboard } from '@/features/dashboard/views/CustomerDashboard';
import { ManagerDashboard } from '@/features/dashboard/views/ManagerDashboard';
import { TellerDashboard } from '@/features/dashboard/views/TellerDashboard';
import { ErrorState, PageLoading } from '@/shared/components/States';
import { getErrorMessage } from '@/shared/utils/errors';

export function DashboardPage() {
  const { t } = useTranslation('dashboard');
  const [data, setData] = useState<RoleDashboardData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setData(await dashboardApi.get());
    } catch (cause) {
      setError(getErrorMessage(cause));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState title={t('error.title')} message={error} onRetry={() => void load()} />;
  if (!data) return <PageLoading rows={7} />;

  switch (data.role) {
    case 'CUSTOMER':
      return <CustomerDashboard data={data} />;
    case 'TELLER':
      return <TellerDashboard data={data} />;
    case 'MANAGER':
      return <ManagerDashboard data={data} />;
    case 'AUDITOR':
      return <AuditorDashboard data={data} />;
    case 'ADMIN':
      return <AdminDashboard data={data} />;
  }
}
