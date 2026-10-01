import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { dashboardApi } from '@/features/dashboard/api/dashboardApi';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import type { RoleDashboardData } from '@/features/dashboard/types/dashboard';
import { renderRoute } from '@/test/render';

const generatedAt = '2026-09-30T16:00:00Z';
const activity = {
  action: 'DEPOSIT' as const,
  customerName: 'Ada Lovelace',
  actorUsername: 'operator',
  accountSuffixes: ['2A91'],
  amount: 250,
  createdAt: generatedAt,
};

function renderDashboard(data: RoleDashboardData) {
  vi.spyOn(dashboardApi, 'get').mockResolvedValue(data);
  return renderRoute(<DashboardPage />);
}

describe('DashboardPage', () => {
  it('renders the customer financial position and only customer actions', async () => {
    renderDashboard({
      role: 'CUSTOMER',
      generatedAt,
      bankUserLinked: true,
      displayName: 'Sofia Rivera',
      totalBalance: 15199.5,
      accountCount: 1,
      accounts: [
        {
          accountId: 'account-2A91',
          accountType: 'CHECKING',
          balance: 15199.5,
          createdAt: generatedAt,
          accountNumber: '100000000001',
        },
      ],
      last30DayDeposits: 15700,
      last30DayWithdrawals: 100,
      last30DayTransfersIn: 0,
      last30DayTransfersOut: 0,
      activitySeries: [{ periodStart: '2026-09-30', deposits: 400, withdrawals: 100, transfers: 0 }],
      recentTransactions: [{ type: 'DEPOSIT', accountSuffix: '2A91', amount: 400, createdAt: generatedAt }],
    });
    expect(await screen.findByRole('heading', { name: 'Welcome, Sofia Rivera' })).toBeInTheDocument();
    expect(screen.getAllByText('$15,199.50').length).toBeGreaterThan(0);
    expect(screen.getByText('$15,700.00')).toBeInTheDocument();
    expect(screen.getByText('100000000001')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Transfer funds' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Manage access' })).not.toBeInTheDocument();
    expect(dashboardApi.get).toHaveBeenCalledTimes(1);
  });

  it('renders a teller-first search workflow and actor-scoped activity', async () => {
    renderDashboard({
      role: 'TELLER',
      generatedAt,
      username: 'mia.teller',
      customerCount: 12,
      accountCount: 21,
      newAccountsToday: 2,
      myOperationsToday: 3,
      myDepositsTodayAmount: 250,
      myWithdrawalsTodayAmount: 40,
      myRecentOperations: [activity],
    });
    expect(await screen.findByRole('heading', { name: 'Good to see you, mia.teller' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Name, email, or account ID')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find customer' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'My recent operations' })).toBeInTheDocument();
    expect(screen.queryByText('By operator')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Transfer funds' })).not.toBeInTheDocument();
  });

  it('renders manager totals, real movement summary, and operational actions', async () => {
    renderDashboard({
      role: 'MANAGER',
      generatedAt,
      customerCount: 12,
      accountCount: 21,
      totalBankBalance: 50000,
      checkingCount: 11,
      savingsCount: 10,
      premiumAccountCount: 7,
      last30DayDepositVolume: 1200,
      last30DayWithdrawalVolume: 300,
      last30DayTransferVolume: 500,
      moneyMovementSeries: [{ periodStart: '2026-09-30', deposits: 1200, withdrawals: 300, transfers: 500 }],
      recentBankingAudits: [activity],
    });
    expect(await screen.findByRole('heading', { name: 'Operational overview' })).toBeInTheDocument();
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
    expect(screen.getByText('$1,200.00 deposited, $300.00 withdrawn, and $500.00 transferred in this period.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Transfer funds' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Manage access' })).not.toBeInTheDocument();
  });

  it('renders an explicitly read-only auditor workspace', async () => {
    renderDashboard({
      role: 'AUDITOR',
      generatedAt,
      customerCount: 12,
      accountCount: 21,
      auditRecordsLast30Days: 60,
      distinctActorsLast30Days: 4,
      depositAuditCount: 20,
      withdrawAuditCount: 18,
      transferAuditCount: 22,
      recentBankingAudits: [activity],
    });
    expect(await screen.findByRole('heading', { name: 'Audit workspace' })).toBeInTheDocument();
    expect(screen.getByText(/Read-only workspace/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Open audit log' })).toHaveLength(2);
    expect(screen.queryByRole('link', { name: 'Transfer funds' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Open an account' })).not.toBeInTheDocument();
  });

  it('renders identity health and security changes for administrators', async () => {
    renderDashboard({
      role: 'ADMIN',
      generatedAt,
      activeAuthUsers: 18,
      disabledAuthUsers: 2,
      roleDistribution: [
        { role: 'CUSTOMER', count: 12 },
        { role: 'TELLER', count: 2 },
        { role: 'MANAGER', count: 2 },
        { role: 'AUDITOR', count: 1 },
        { role: 'ADMIN', count: 3 },
      ],
      linkedCustomerIdentities: 10,
      unlinkedCustomerIdentities: 2,
      customerCount: 12,
      accountCount: 21,
      recentSecurityAudits: [{ action: 'ROLE_CHANGED', actorUsername: 'ava.admin', targetUsername: 'user.one', createdAt: generatedAt }],
      recentBankingAudits: [activity],
    });
    expect(await screen.findByRole('heading', { name: 'Access overview' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Manage access' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Security audit' })).toBeInTheDocument();
    expect(screen.getByText('Role changed')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
  });
});
