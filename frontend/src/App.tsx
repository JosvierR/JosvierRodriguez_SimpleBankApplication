import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { AppShell } from './components/layout/AppShell'
import { ToastProvider } from './components/ui/Toast'
import { AccountDetailsPage } from './pages/AccountDetailsPage'
import { AccountsPage } from './pages/AccountsPage'
import { AdminPage } from './pages/AdminPage'
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

export function App() {
  return <BrowserRouter><AuthProvider><ToastProvider><Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route index element={<DashboardPage />} /><Route path="customers" element={<CustomersPage />} /><Route path="customers/:userId" element={<CustomerDetailsPage />} /><Route path="accounts" element={<AccountsPage />} /><Route path="accounts/new" element={<CreateAccountPage />} /><Route path="accounts/:accountId" element={<AccountDetailsPage />} /><Route path="accounts/:accountId/deposit" element={<DepositPage />} /><Route path="accounts/:accountId/withdraw" element={<WithdrawPage />} /><Route path="accounts/:accountId/transactions" element={<TransactionHistoryPage />} /><Route path="transfer" element={<TransferPage />} /><Route path="audits" element={<AuditsPage />} /><Route element={<AdminRoute />}><Route path="admin" element={<AdminPage />} /></Route></Route></Route><Route path="*" element={<NotFoundPage />} /></Routes></ToastProvider></AuthProvider></BrowserRouter>
}
