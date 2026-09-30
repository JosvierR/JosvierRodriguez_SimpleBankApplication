import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/ui/Toast'
import { AccountDetailsPage } from './pages/AccountDetailsPage'
import { AccountsPage } from './pages/AccountsPage'
import { AdminPage } from './pages/AdminPage'
import { AccessManagementPage } from './pages/AccessManagementPage'
import { SecurityAuditPage } from './pages/SecurityAuditPage'
import { MyAccountsPage, MyAccountDetailsPage, MyTransactionsPage } from './pages/CustomerAccountsPage'
import { CustomerTransferPage } from './pages/CustomerTransferPage'
import { ProfilePage } from './pages/ProfilePage'
import { AuditsPage } from './pages/AuditsPage'
import { CreateAccountPage } from './pages/CreateAccountPage'
import { CustomerDetailsPage } from './pages/CustomerDetailsPage'
import { CustomersPage } from './pages/CustomersPage'
import { DashboardPage } from './pages/DashboardPage'
import { DepositPage, WithdrawPage } from './pages/MoneyMovementPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { TransactionHistoryPage } from './pages/TransactionHistoryPage'
import { TransferPage } from './pages/TransferPage'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RoleRoute } from './routes/RoleRoute'

export function App() {
  return <BrowserRouter><AuthProvider><ToastProvider><Routes>
    <Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} />
    <Route element={<ProtectedRoute />}><Route element={<AppShell />}>
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
      <Route element={<RoleRoute allow={['MANAGER', 'ADMIN']} />}><Route path="transfer" element={<TransferPage />} /></Route>
      <Route element={<RoleRoute allow={['MANAGER', 'AUDITOR', 'ADMIN']} />}><Route path="audits" element={<AuditsPage />} /></Route>
      <Route element={<AdminRoute />}>
        <Route path="admin" element={<AdminPage />} />
        <Route path="admin/access" element={<AccessManagementPage />} />
        <Route path="admin/security-audit" element={<SecurityAuditPage />} />
      </Route>
    </Route></Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes></ToastProvider></AuthProvider></BrowserRouter>
}
