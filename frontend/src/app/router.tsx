import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AdminRoute } from '@/app/AdminRoute';
import { LEGACY_ROOTS, appPath } from '@/app/routes';
import { ProtectedRoute } from '@/app/ProtectedRoute';
import { RoleRoute } from '@/app/RoleRoute';
import { AppShell } from '@/shared/layout/AppShell';
import { PageLoading } from '@/shared/components/States';

const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const MyAccountsPage = lazy(() =>
  import('@/features/customer-portal/pages/CustomerAccountsPage').then((module) => ({ default: module.MyAccountsPage })),
);
const MyAccountDetailsPage = lazy(() =>
  import('@/features/customer-portal/pages/CustomerAccountsPage').then((module) => ({ default: module.MyAccountDetailsPage })),
);
const MyTransactionsPage = lazy(() =>
  import('@/features/customer-portal/pages/CustomerAccountsPage').then((module) => ({ default: module.MyTransactionsPage })),
);
const CustomerTransferPage = lazy(() =>
  import('@/features/customer-portal/pages/CustomerTransferPage').then((module) => ({ default: module.CustomerTransferPage })),
);
const ProfilePage = lazy(() => import('@/features/customer-portal/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const CustomersPage = lazy(() => import('@/features/customers/pages/CustomersPage').then((module) => ({ default: module.CustomersPage })));
const CustomerDetailsPage = lazy(() =>
  import('@/features/customers/pages/CustomerDetailsPage').then((module) => ({ default: module.CustomerDetailsPage })),
);
const CreateAccountPage = lazy(() =>
  import('@/features/customers/pages/CreateAccountPage').then((module) => ({ default: module.CreateAccountPage })),
);
const AccountsPage = lazy(() => import('@/features/accounts/pages/AccountsPage').then((module) => ({ default: module.AccountsPage })));
const AccountDetailsPage = lazy(() =>
  import('@/features/accounts/pages/AccountDetailsPage').then((module) => ({ default: module.AccountDetailsPage })),
);
const DepositPage = lazy(() => import('@/features/accounts/pages/MoneyMovementPage').then((module) => ({ default: module.DepositPage })));
const WithdrawPage = lazy(() => import('@/features/accounts/pages/MoneyMovementPage').then((module) => ({ default: module.WithdrawPage })));
const TransactionHistoryPage = lazy(() =>
  import('@/features/transactions/pages/TransactionHistoryPage').then((module) => ({ default: module.TransactionHistoryPage })),
);
const TransferPage = lazy(() => import('@/features/transfers/pages/TransferPage').then((module) => ({ default: module.TransferPage })));
const AuditsPage = lazy(() => import('@/features/audits/pages/AuditsPage').then((module) => ({ default: module.AuditsPage })));
const AdminPage = lazy(() => import('@/features/access-management/pages/AdminPage').then((module) => ({ default: module.AdminPage })));
const AccessManagementPage = lazy(() =>
  import('@/features/access-management/pages/AccessManagementPage').then((module) => ({ default: module.AccessManagementPage })),
);
const SecurityAuditPage = lazy(() =>
  import('@/features/access-management/pages/SecurityAuditPage').then((module) => ({ default: module.SecurityAuditPage })),
);
const NotFoundPage = lazy(() => import('@/shared/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

function LegacyRedirect() {
  const location = useLocation();
  return <Navigate to={appPath(`${location.pathname}${location.search}${location.hash}`)} replace />;
}

export function AppRouter() {
  return (
    <Suspense
      fallback={
        <main className="route-loading">
          <PageLoading />
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {LEGACY_ROOTS.flatMap((root) => [
          <Route key={root} path={`/${root}`} element={<LegacyRedirect />} />,
          <Route key={`${root}-nested`} path={`/${root}/*`} element={<LegacyRedirect />} />,
        ])}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<DashboardPage />} />
            <Route element={<RoleRoute allow={['CUSTOMER']} />}>
              <Route path="my-accounts" element={<MyAccountsPage />} />
              <Route path="my-accounts/:accountId" element={<MyAccountDetailsPage />} />
              <Route path="my-accounts/:accountId/transactions" element={<MyTransactionsPage />} />
              <Route path="my-transfer" element={<CustomerTransferPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route element={<RoleRoute allow={['TELLER', 'MANAGER', 'AUDITOR', 'ADMIN']} />}>
              <Route path="customers" element={<CustomersPage />} />
              <Route path="customers/:userId" element={<CustomerDetailsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="accounts/:accountId" element={<AccountDetailsPage />} />
              <Route path="accounts/:accountId/transactions" element={<TransactionHistoryPage />} />
            </Route>
            <Route element={<RoleRoute allow={['TELLER', 'MANAGER', 'ADMIN']} />}>
              <Route path="accounts/new" element={<CreateAccountPage />} />
              <Route path="accounts/:accountId/deposit" element={<DepositPage />} />
              <Route path="accounts/:accountId/withdraw" element={<WithdrawPage />} />
            </Route>
            <Route element={<RoleRoute allow={['MANAGER', 'ADMIN']} />}>
              <Route path="transfer" element={<TransferPage />} />
            </Route>
            <Route element={<RoleRoute allow={['MANAGER', 'AUDITOR', 'ADMIN']} />}>
              <Route path="audits" element={<AuditsPage />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminPage />} />
              <Route path="admin/access" element={<AccessManagementPage />} />
              <Route path="admin/security-audit" element={<SecurityAuditPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
